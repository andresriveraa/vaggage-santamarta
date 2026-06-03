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

export const fetchStoryLocations = async (): Promise<StoryLocation[]> => {
  const response = await fetch(AIRTABLE_BASE_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable fetch failed: ${response.status}`);
  }

  const data: AirtableResponse = await response.json();

  return data.records.map((record, index) => {
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
