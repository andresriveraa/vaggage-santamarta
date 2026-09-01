import {AIRTABLE_ACCESS_TOKEN} from '@env';

const AIRTABLE_BASE_URL =
  'https://api.airtable.com/v0/appq0BfOqhiSFpngK/tblnCBkcp4kKhAJHF';

export interface StoryLocation {
  id: number;
  title: string;
  description: string;
  description_en: string;
  latitude: number;
  longitude: number;
  audioFile: string;
  played: boolean;
}

export interface Guide {
  id: string; // Internal ID, ej. "bog-0101"
  name: string;
  duration: string;
  city: string;
  cityId: number;
  country: string;
  price: string;
  pointsCount: number;
  tags: string[];
}

interface AirtableRecord {
  id: string;
  fields: {
    title?: string;
    Title?: string;
    description?: string;
    Description?: string;
    description_en?: string;
    latitude?: number;
    Latitude?: number;
    longitude?: number;
    Longitude?: number;
    [key: string]: unknown;
  };
}

interface AirtableResponse {
  records: AirtableRecord[];
}

const fetchRecords = async (queryParams = ''): Promise<AirtableRecord[]> => {
  const response = await fetch(`${AIRTABLE_BASE_URL}${queryParams}`, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable fetch failed: ${response.status}`);
  }

  const data: AirtableResponse = await response.json();
  return data.records;
};

const asText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
};

const asNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

/**
 * Construye la lista de guías agrupando los puntos por "Internal ID".
 * Los datos de la card (nombre, duración, ciudad, pais, precio) se toman
 * de la primera fila de cada guía que tenga la celda llena.
 */
export const fetchGuides = async (): Promise<Guide[]> => {
  const records = await fetchRecords();
  const guides = new Map<string, Guide>();

  for (const record of records) {
    const f = record.fields;
    const internalId = asText(f['Internal ID']);
    if (!internalId) {
      continue;
    }

    const guide = guides.get(internalId) ?? {
      id: internalId,
      name: '',
      duration: '',
      city: '',
      cityId: 0,
      country: '',
      price: '',
      pointsCount: 0,
      tags: [],
    };

    guide.pointsCount += 1;
    guide.name = guide.name || asText(f.Title ?? f.Nombre);
    guide.duration = guide.duration || asText(f['duración'] ?? f.duracion);
    guide.city = guide.city || asText(f.ciudad ?? f.Ciudad);
    guide.cityId = guide.cityId || asNumber(f.city_id ?? f['City ID'] ?? f.CityId);
    guide.country = guide.country || asText(f.pais ?? f['país'] ?? f.Pais);
    guide.price = guide.price || asText(f.precio ?? f.Precio);
    guide.tags = Array.isArray(f.Tags) ? f.Tags : [];


    guides.set(internalId, guide);
  }

  return Array.from(guides.values());
};

export const fetchStoryLocations = async (
  guideId: string,
): Promise<StoryLocation[]> => {
  const formula = encodeURIComponent(`{Internal ID}='${guideId}'`);
  const records = await fetchRecords(`?filterByFormula=${formula}`);

  return records.map((record, index) => {
    const f = record.fields;
    return {
      id: index + 1,
      title: (f.title ?? f.Title ?? `Punto ${index + 1}`) as string,
      description: (f.description ?? f.Description ?? '') as string,
      description_en: (f.description_en ?? '') as string,
      latitude: (f.latitude ?? f.Latitude ?? 0) as number,
      longitude: (f.longitude ?? f.Longitude ?? 0) as number,
      audioFile: '',
      played: false,
    };
  });
};
