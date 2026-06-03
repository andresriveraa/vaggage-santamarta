import {useState, useEffect} from 'react';
import {Platform, Alert, AppState} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {getDistance} from 'geolib';
import {fetchStoryLocations, type StoryLocation} from './src/services/AirtableService';
import { initTTS, releaseTTS, speak as speakSherpa, type TTSLang } from './src/services/tts-sherpa';


export type { TTSLang } from './src/services/tts-sherpa';
export const WATCH_ID_INITIAL = null;
const PROXIMITY_RADIUS = 20; // 20 metros de radio para la detección
const AUDIO_COOLDOWN_MS = 10000; // 10 segundos de pausa para evitar repeticiones/superposiciones

const useMainHook = (ttsLang: TTSLang, onTTSInitResult?: (success: boolean) => void) => {
  const [watchId, setWatchId] = useState<number | null>(WATCH_ID_INITIAL);
  const [currentPosition, setCurrentPosition] =
    useState<Geolocation.GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storyLocations, setStoryLocations] = useState<StoryLocation[]>([]);
  const [isAudioLocked, setIsAudioLocked] = useState(false);
  const [appState, setAppState] = useState<string>('');
  const [isGuideActive, setIsGuideActive] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  // Cargar ubicaciones desde Airtable al iniciar
  useEffect(() => {
    fetchStoryLocations()
      .then(locations => {
        if (locations.length > 0) {
          setStoryLocations(locations);
          console.log(
            `[useMain] ${locations.length} ubicaciones cargadas desde Airtable`,
          );
        }
      })
      .catch(err => {
        console.warn(
          '[useMain] Error al cargar ubicaciones desde Airtable:',
          err,
        );
      });
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('always');
      return auth === 'granted';
    }
    return false;
  };

  // --- Función de reproducción TTS ---
  const playStoryTTS = (description: string, storyTitle: string) => {
    if (isAudioLocked) {
      console.log(`Audio bloqueado. Saltando reproducción de: ${storyTitle}`);
      return;
    }

    setIsAudioLocked(true);
    setTimeout(() => {
      setIsAudioLocked(false);
      console.log('Bloqueo de audio liberado.');
    }, AUDIO_COOLDOWN_MS);

    console.log(`Reproduciendo TTS: ${storyTitle}`);
    speakSherpa(description);
  };


  // --- C. Lógica Principal en el Callback de Ubicación ---
  const locationUpdateCallback = (position: Geolocation.GeoPosition) => {
    setCurrentPosition(position);
    console.log(
      `Posición actualizada: ${position.coords.latitude}, ${position.coords.longitude}`,
    );

    const userCoords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    setStoryLocations(prevLocations =>
      prevLocations.map(story => {
        if (story.played) {
          return story;
        }

        const distanceInMeters = getDistance(userCoords, {
          latitude: story.latitude,
          longitude: story.longitude,
        });

        console.log(
          `Distancia a "${story.title}": ${distanceInMeters.toFixed(2)}m`,
        );

        if (distanceInMeters < PROXIMITY_RADIUS) {
          const textToSpeak =
            ttsLang === 'en' && story.description_en
              ? story.description_en
              : story.description;
          playStoryTTS(textToSpeak, story.title);
          return {...story, played: true};
        }

        return story;
      }),
    );
  };

  const startWatching = async () => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      console.log('No se puede iniciar la observación sin permisos.');
      const auth = await Geolocation.requestAuthorization('always');
      if (auth === 'granted') {
        return true;
      }
      Alert.alert(
        'Permiso Denegado',
        "El rastreo en segundo plano requiere permiso 'Siempre'.",
      );
      return false;
    }

    if (watchId !== WATCH_ID_INITIAL) {
      Geolocation.clearWatch(watchId);
      setWatchId(WATCH_ID_INITIAL);
      setCurrentPosition(null);
    }

    const options = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 10000,
      distanceFilter: 1,
      forceRequestLocation: true,
      useSignificantChanges: false,
      pausesLocationUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: true,
    };

    console.log('Iniciando la observación de la posición...');

    const newWatchId = Geolocation.watchPosition(
      locationUpdateCallback,
      geoError => {
        console.log('Error de Geolocalización:', geoError);
        setError(geoError.message);

        Geolocation.clearWatch(newWatchId);
        setWatchId(WATCH_ID_INITIAL);
        setCurrentPosition(null);

        Alert.alert(
          'Error de Ubicación',
          `No se pudo obtener la ubicación: ${geoError.message}`,
        );
      },
      options,
    );

    setWatchId(newWatchId);
  };

  const stopWatching = () => {
    if (watchId !== WATCH_ID_INITIAL) {
      Geolocation.clearWatch(watchId);
      setWatchId(WATCH_ID_INITIAL);
      setCurrentPosition(null);
      console.log('Observación de la posición detenida.');
    }
  };

  useEffect(() => {
    return () => {
      if (watchId !== WATCH_ID_INITIAL) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const nearestUnplayedLocation = (() => {
    if (!currentPosition) { return null; }
    const userCoords = {
      latitude: currentPosition.coords.latitude,
      longitude: currentPosition.coords.longitude,
    };
    const unplayed = storyLocations.filter(l => !l.played);
    if (unplayed.length === 0) { return null; }
    return unplayed.reduce((nearest, loc) => {
      const d = getDistance(userCoords, {latitude: loc.latitude, longitude: loc.longitude});
      const dNearest = getDistance(userCoords, {latitude: nearest.latitude, longitude: nearest.longitude});
      return d < dNearest ? loc : nearest;
    });
  })();

  const toggleGuide = () => setIsGuideActive(prev => !prev);

  const onStart = async () => {
    await startWatching();
  };
  const onFinish = () => {
    stopWatching();
  };

  useEffect(() => {
    (async () => {
      const success = await initTTS(ttsLang);
      onTTSInitResult?.(success);
    })();
    return () => { releaseTTS(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsLang]);

  return {
    state: {
      currentPosition,
      error,
      watchId,
      appState,
      storyLocations,
      isGuideActive,
      nearestUnplayedLocation,
      ttsLang,
    },
    actions: {
      onStart,
      onFinish,
      toggleGuide,
    },
  };
};

export default useMainHook;
