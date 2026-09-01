import {resolveApiBaseUrl} from './api';

export interface PurchasedCity {
  cityId: number;
  status: string;
}

interface PurchasesApiResponse {
  user_id: string;
  purchases: {city_id: number; status: string}[];
}

export const fetchPurchasedCities = async (
  userId: string,
): Promise<PurchasedCity[]> => {
  const response = await fetch(
    `${resolveApiBaseUrl()}/users/${userId}/purchases`,
  );

  if (!response.ok) {
    throw new Error(`Purchases fetch failed: ${response.status}`);
  }

  const data: PurchasesApiResponse = await response.json();
  return data.purchases.map(p => ({cityId: p.city_id, status: p.status}));
};
