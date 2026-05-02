import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a naturalist researcher cross-referencing color science with biological taxonomy.
Given a target hex color, identify one botanical specimen (flower, plant, or moss) and one
zoological specimen (bird, mammal, insect, reptile, or fish) whose dominant visible color
most closely matches the input.

CONSTRAINTS (non-negotiable):
- Perceptual color distance uses CIE ΔE 2000. A match requires ΔE ≤ 10.
- Species must have real Wikipedia articles with accessible photo thumbnails.
- Scientific name must follow current binomial nomenclature (Genus species). Include family.
- dominantHex is the hex of the species' most prominent color patch (not average color).
- Do not force a match. If no species clearly matches, return the closest with its actual deltaE.
- Description: 2 sentences max. Observer-perspective. No adjectives like "beautiful" or "stunning."
- funFact: one sentence. Specific and verifiable. About the species' color biology (pigment
  source, evolutionary purpose, structural coloration, etc.).
- wikiTitle: exact Wikipedia article title string (e.g. "Vermilion flycatcher") for API lookup.

Return JSON matching the provided schema. No extra keys.`;

const FEW_SHOT_EXAMPLES = [
  {
    botanical: {
      commonName: 'Red Torch Ginger',
      scientificName: 'Etlingera elatior',
      family: 'Zingiberaceae',
      description: 'A tropical plant whose waxy, torch-like inflorescences emerge on long stalks from the forest floor. The bracts cluster tightly in overlapping layers of deep vermilion.',
      funFact: 'The red anthocyanin pigment in the bracts evolved as a visual signal exclusively for sunbirds — most bees cannot perceive the red wavelengths.',
      dominantHex: '#C34039',
      deltaE: 2.1,
      wikiTitle: 'Etlingera elatior',
    },
    zoological: {
      commonName: 'Vermilion Flycatcher',
      scientificName: 'Pyrocephalus rubinus',
      family: 'Tyrannidae',
      description: 'A small passerine of open scrublands. Males carry a vivid cap and breast that contrasts sharply with dark brown wings.',
      funFact: 'The coloration is carotenoid-based; the bird cannot synthesize it and must consume enough red-orange arthropods to maintain plumage saturation through molt.',
      dominantHex: '#C94038',
      deltaE: 1.7,
      wikiTitle: 'Vermilion flycatcher',
    },
  },
  {
    botanical: {
      commonName: 'Blue Chalk Sticks',
      scientificName: 'Curio repens',
      family: 'Asteraceae',
      description: 'A succulent groundcover native to coastal South Africa. The cylindrical leaves hold a glaucous, waxy bloom that reads as muted blue-green against sandy substrates.',
      funFact: 'The blue-grey waxy coating (epicuticular wax) reduces UV radiation and water loss — both color and function are products of the same cellular secretion.',
      dominantHex: '#3D7D8C',
      deltaE: 2.9,
      wikiTitle: 'Curio repens',
    },
    zoological: {
      commonName: 'Malachite Kingfisher',
      scientificName: 'Corythornis cristatus',
      family: 'Alcedinidae',
      description: 'A small, jewel-bright kingfisher of sub-Saharan Africa. The crown and back display an intense teal iridescence visible from 20 meters against riverbank vegetation.',
      funFact: 'The color is structural, not pigment-based — microscopic melanin granules in barbules scatter blue-green wavelengths through thin-film interference, like a soap bubble.',
      dominantHex: '#3B7B8B',
      deltaE: 1.4,
      wikiTitle: 'Malachite kingfisher',
    },
  },
  {
    botanical: {
      commonName: 'Black-eyed Susan',
      scientificName: 'Rudbeckia hirta',
      family: 'Asteraceae',
      description: 'A prairie composite native to North America. The ray florets radiate outward in warm golden-yellow from a dark central disc.',
      funFact: 'While the petals appear uniformly yellow to humans, they absorb UV near the base — a bull\'s-eye pattern visible to pollinating insects guides them toward the disc.',
      dominantHex: '#D6C156',
      deltaE: 2.3,
      wikiTitle: 'Rudbeckia hirta',
    },
    zoological: {
      commonName: 'American Goldfinch',
      scientificName: 'Spinus tristis',
      family: 'Fringillidae',
      description: 'A small North American finch. Males in breeding plumage are a saturated canary-yellow offset by black wings, cap, and tail.',
      funFact: 'Goldfinches are among the strictest vegetarians in North American birds, and their carotenoid-sourced yellow plumage reflects this — seed carotenoids convert directly to the yellow pigment zeaxanthin.',
      dominantHex: '#D9C45F',
      deltaE: 1.1,
      wikiTitle: 'American goldfinch',
    },
  },
];

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    botanical: {
      type: SchemaType.OBJECT,
      properties: {
        commonName: { type: SchemaType.STRING },
        scientificName: { type: SchemaType.STRING },
        family: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        funFact: { type: SchemaType.STRING },
        dominantHex: { type: SchemaType.STRING },
        deltaE: { type: SchemaType.NUMBER },
        wikiTitle: { type: SchemaType.STRING },
      },
      required: ['commonName', 'scientificName', 'family', 'description', 'funFact', 'dominantHex', 'deltaE', 'wikiTitle'],
    },
    zoological: {
      type: SchemaType.OBJECT,
      properties: {
        commonName: { type: SchemaType.STRING },
        scientificName: { type: SchemaType.STRING },
        family: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        funFact: { type: SchemaType.STRING },
        dominantHex: { type: SchemaType.STRING },
        deltaE: { type: SchemaType.NUMBER },
        wikiTitle: { type: SchemaType.STRING },
      },
      required: ['commonName', 'scientificName', 'family', 'description', 'funFact', 'dominantHex', 'deltaE', 'wikiTitle'],
    },
  },
  required: ['botanical', 'zoological'],
};

interface SpecimenData {
  commonName: string;
  scientificName: string;
  family: string;
  description: string;
  funFact: string;
  dominantHex: string;
  deltaE: number;
  wikiTitle: string;
}

interface SpecimenWithImage extends SpecimenData {
  imageUrl: string | null;
}

interface MatchResponse {
  botanical?: SpecimenWithImage;
  zoological?: SpecimenWithImage;
  error?: string;
}

async function fetchWikiThumbnail(wikiTitle: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(wikiTitle.replace(/ /g, '_'));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
      headers: {
        'User-Agent': 'color-match-app/1.0 (educational project)',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return (data.thumbnail?.source as string) ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { hex } = body as { hex?: string };

    // Validate hex format
    if (!hex || typeof hex !== 'string' || !/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
      return NextResponse.json({ error: 'INVALID_HEX' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return NextResponse.json({ error: 'API_ERROR' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA as any,
      },
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent([
      {
        text: `Here are reference examples:\n${JSON.stringify(FEW_SHOT_EXAMPLES, null, 2)}`,
      },
      {
        text: `Match specimens for hex: ${hex.toUpperCase()}`,
      },
    ]);

    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText) as {
      botanical: SpecimenData;
      zoological: SpecimenData;
    };

    // Fetch Wikipedia thumbnails in parallel
    const [botanicalImg, zoologicalImg] = await Promise.all([
      fetchWikiThumbnail(parsedResponse.botanical.wikiTitle),
      fetchWikiThumbnail(parsedResponse.zoological.wikiTitle),
    ]);

    const response: MatchResponse = {
      botanical: {
        ...parsedResponse.botanical,
        imageUrl: botanicalImg,
      },
      zoological: {
        ...parsedResponse.zoological,
        imageUrl: zoologicalImg,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/match:', error);
    return NextResponse.json({ error: 'API_ERROR' }, { status: 500 });
  }
}
