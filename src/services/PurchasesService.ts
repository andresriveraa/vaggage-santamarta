import {resolveApiBaseUrl} from './api';
import {AppLang} from '../constants/lang';
export interface PurchasedCity {
  cityId: number;
  status: string;
}

export interface IPointsGuide {
  id: number;
  stop_name: string;
  language: string;
  duration_seconds: number;
  storage_path: string;
  audio_url?: string;
  expires_in: number;
  latitude: number;
  longitude: number;
}

export interface CityGuides {
  id: string;
  name: string;
  points: IPointsGuide[];
}

export interface ICities {
  slug: string;
  name: string;
  id: string;
  guides: CityGuides[];
}

interface GuidesApiResponse {
  user_id: string;
  cities: ICities[];
}
export const fetchPurchasedCities = async (
  userId: string,
  lang: AppLang,
): Promise<ICities[]> => {
  const response = await fetch(
    `${resolveApiBaseUrl()}/users/${userId}/guides?lang=${lang}&status=completed`,
  );

  if (!response.ok) {
    throw new Error(`Purchases fetch failed: ${response.status}`);
  }

  const data: GuidesApiResponse = await response.json();

  return data.cities;
};
