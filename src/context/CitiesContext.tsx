import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {fetchPurchasedCities, ICities} from '../services/PurchasesService';
import {useAuth} from './AuthContext';

type CitiesContextValue = {
  cities: ICities[];
  isLoading: boolean;
  hasError: boolean;
  reload: () => Promise<void>;
};

const CitiesContext = createContext<CitiesContextValue | null>(null);

export function CitiesProvider({children}: {children: React.ReactNode}) {
  const {user, lang} = useAuth();
  const [cities, setCities] = useState<ICities[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    setIsLoading(true);
    setHasError(false);
    try {
      const citiesWithGuides = await fetchPurchasedCities(user.id, lang);
      setCities(citiesWithGuides);
    } catch (error) {
      console.error(error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [user, lang]);

  useEffect(() => {
    if (user) {
      load();
    } else {
      // Sesión cerrada: no dejar las guías del usuario anterior visibles.
      setCities([]);
    }
  }, [user, load]);

  return (
    <CitiesContext.Provider value={{cities, isLoading, hasError, reload: load}}>
      {children}
    </CitiesContext.Provider>
  );
}

export function useCities(): CitiesContextValue {
  const ctx = useContext(CitiesContext);
  if (!ctx) {
    throw new Error('useCities must be used within a CitiesProvider');
  }
  return ctx;
}
