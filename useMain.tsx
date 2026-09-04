import {useState, useEffect, useRef} from 'react';
import {Platform, Alert, AppState, Vibration, PermissionsAndroid} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {getDistance} from 'geolib';
import type {StoryLocation} from './src/services/AirtableService';
import type { CityGuides, IPointsGuide} from './src/services/PurchasesService';
import {GUIDANCE_MILESTONES} from './src/services/guidance';
import {
  downloadAudioGuide,
  loadCachedAudioGuide,
  playAudioFile,
  stopAudio,
  type CachedAudioGuidePoint,
} from './src/services/AudioGuideService';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './src/AppContent';
import { useAuth } from './src/context/AuthContext';

// La narración es un archivo de audio descargado antes de salir a caminar, no
// voz sintetizada en el momento. La guía hacia la siguiente parada, en cambio,
// es visual (mapa, tarjeta de progreso) y háptica (vibración).
//
// Las paradas (coordenadas, nombre y audio) salen todas de `guide.points`,
// ya cargado en el contexto de ciudades — unidas por el `id` numérico del
// punto. Ya no dependemos de Airtable ni de un fetch propio para el mapa.

export type AudioStatus = 'idle' | 'downloading' | 'ready' | 'error';

export const WATCH_ID_INITIAL = null;
const PROXIMITY_RADIUS = 20; // 20 metros de radio para la detección
const GUIDANCE_INTERVAL_MS = 15000; // pausa mínima entre avisos hápticos de guía
const AWAY_THRESHOLD_M = 30; // metros de alejamiento (vs. lo más cerca que estuvo) antes de avisar

// En iOS el patrón es solo la separación entre pulsos; suficiente para distinguirlos
const ARRIVAL_VIBRATION = [0, 400, 250, 400];
const GUIDANCE_VIBRATION = [0, 200];

type GuidanceProgress = {
  targetId: number | null;
  milestonesSeeded: boolean;
  announcedMilestones: Set<number>;
  minDistance: number;
  awayWarned: boolean;
  lastCueAt: number;
};

const freshGuidance = (): GuidanceProgress => ({
  targetId: null,
  milestonesSeeded: false,
  announcedMilestones: new Set(),
  minDistance: Infinity,
  awayWarned: false,
  lastCueAt: 0,
});

const useMainHook = () => {

  const navigation = useNavigation();
  const onBack = () => navigation.goBack();
  const route = useRoute<RouteProp<RootStackParamList, 'MapGuide'>>();
  const guide: CityGuides | undefined= route.params?.guide;
  const {user, lang} = useAuth();


  const [watchId, setWatchId] = useState<number | null>(WATCH_ID_INITIAL);
  const [currentPosition, setCurrentPosition] = useState<Geolocation.GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storyLocations, setStoryLocations] = useState<StoryLocation[]>([]);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [appState, setAppState] = useState<string>('');
  const [isGuideActive, setIsGuideActive] = useState(false);
  const [isAudioBusy, setIsAudioBusy] = useState(false);
  const [audioPoints, setAudioPoints] = useState<CachedAudioGuidePoint[]>([]);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');
  const [audioProgress, setAudioProgress] = useState({completed: 0, total: 0});
  // Punto elegido a mano desde el mapa ("Guíame aquí"): cuando está activo,
  // reemplaza a la parada más cercana sin visitar como objetivo de la guía.
  const [manualTargetId, setManualTargetId] = useState<number | null>(null);

  // El callback de watchPosition se registra una sola vez, así que todo lo que
  // lee en cada actualización tiene que vivir en refs (no en state capturado).
  const storyLocationsRef = useRef<StoryLocation[]>([]);
  const isGuideActiveRef = useRef(false);
  const manualTargetIdRef = useRef<number | null>(null);
  const guidanceRef = useRef<GuidanceProgress>(freshGuidance());
  const audioPointsRef = useRef<CachedAudioGuidePoint[]>([]);
  const isPlayingRef = useRef(false);

  const userId = user?.id ?? '';
  const guideId = guide?.id ?? ''
  const guidePoints: IPointsGuide[] | undefined = guide?.points;



  useEffect(() => {
    storyLocationsRef.current = storyLocations;
  }, [storyLocations]);
  useEffect(() => {
    isGuideActiveRef.current = isGuideActive;
  }, [isGuideActive]);
  useEffect(() => {
    manualTargetIdRef.current = manualTargetId;
  }, [manualTargetId]);
  useEffect(() => {
    audioPointsRef.current = audioPoints;
  }, [audioPoints]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  // Construir las paradas del recorrido a partir de `guide.points`, ya
  // cargado en el contexto de ciudades: no hace falta pedirlo de nuevo.
  useEffect(() => {

    const locations: StoryLocation[] = guidePoints
      ?.map((point: IPointsGuide)  => ({
        id: point.id,
        title: point.stop_name,
        description: '',
        description_en: '',
        latitude: point.latitude,
        longitude: point.longitude,
        audioFile: point.audio_url ?? '',
        played: false,
      })) ?? [];

    setStoryLocations(locations);
    storyLocationsRef.current = locations;
    guidanceRef.current = freshGuidance();
    console.log(
      `[useMain] ${locations.length} ubicaciones cargadas para la guía ${guideId}`,
    );
  }, [guideId, lang, guidePoints]);

  // Lo que ya esté en disco de esta guía, leído sin red. Si el usuario la
  // descargó antes, puede salir a caminar en modo avión sin tocar el botón.
  useEffect(() => {
    let cancelled = false;
    setAudioStatus('idle');
    setAudioPoints([]);
    audioPointsRef.current = [];

    loadCachedAudioGuide(guideId, lang)
      .then(cached => {
        if (cancelled || !cached?.some(p => p.localPath)) {
          return;
        }
        setAudioPoints(cached);
        audioPointsRef.current = cached;
        setAudioStatus('ready');
        setAudioProgress({completed: cached.length, total: cached.length});
      })
      .catch(err => console.warn('[useMain] Error leyendo el caché de audio:', err));

    return () => {
      cancelled = true;
    };
  }, [guideId, lang]);

  // Descarga explícita: son decenas de MB y el usuario decide cuándo gastarlos.
  // Reintentar es barato — lo que ya está en disco no se vuelve a bajar.
  const downloadGuideAudio = async () => {
    if (userId === null) {
      console.warn('[useMain] Sin sesión: no se puede pedir la audioguía');
      setAudioStatus('error');
      return;
    }

    setAudioStatus('downloading');
    setAudioProgress({completed: 0, total: 0});
    try {
      const points = await downloadAudioGuide(user?.id ?? '', guide?.id ?? '', lang, (completed, total) =>
        setAudioProgress({completed, total}),
      );
      setAudioPoints(points);
      audioPointsRef.current = points;
      setAudioStatus('ready');
    } catch (err) {
      console.warn('[useMain] Error descargando la audioguía:', err);
      setAudioStatus('error');
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('always');
      return auth === 'granted';
    }
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de ubicación',
          message:
            'Vaggage necesita tu ubicación para narrar las paradas del recorrido cuando te acerques a ellas.',
          buttonPositive: 'Permitir',
          buttonNegative: 'Cancelar',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  // --- Llegada a una parada: vibra y reproduce su audioguía. ---
  // Una parada sin audio descargado se marca igual y el recorrido sigue en
  // silencio: la descripción queda visible en la tarjeta del mapa, y no tiene
  // sentido dejar el recorrido bloqueado por un archivo que puede no existir.
  const markArrival = (story: StoryLocation) => {
    Vibration.vibrate(ARRIVAL_VIBRATION);

    const point = audioPointsRef.current.find(p => p.trackId === story.id);
    if (!point?.localPath) {
      console.log(`Llegada a ${story.title}: sin audio, se sigue en silencio`);
      return;
    }

    console.log(`Reproduciendo audioguía: ${story.title}`);
    isPlayingRef.current = true;
    setIsAudioBusy(true);
    playAudioFile(point.localPath).finally(() => {
      isPlayingRef.current = false;
      setIsAudioBusy(false);
    });
  };

  // --- Guía háptica hacia la siguiente parada (manos libres) ---
  // Misma máquina de estados que la guía por voz: se avisa al cruzar un hito de
  // distancia y una vez si el usuario se aleja. Sin voz, el aviso es la
  // vibración; la distancia exacta ya está en la tarjeta de progreso.
  const runGuidanceFeedback = (target: StoryLocation, distance: number) => {
    const g = guidanceRef.current;
    if (g.targetId !== target.id) {
      guidanceRef.current = {...freshGuidance(), targetId: target.id};
    }
    const guidance = guidanceRef.current;
    guidance.minDistance = Math.min(guidance.minDistance, distance);

    const now = Date.now();
    if (isPlayingRef.current || now - guidance.lastCueAt < GUIDANCE_INTERVAL_MS) {
      return;
    }

    // Al fijar el objetivo, los hitos mayores a la distancia actual ya quedaron
    // atrás: se dan por avisados para no vibrar por algo que nunca se cruzó.
    if (!guidance.milestonesSeeded) {
      guidance.milestonesSeeded = true;
      guidance.lastCueAt = now;
      GUIDANCE_MILESTONES.filter(m => m >= distance).forEach(m =>
        guidance.announcedMilestones.add(m),
      );
      return;
    }

    // Aviso de alejamiento (una vez, se rearma al volver a acercarse)
    if (
      distance > guidance.minDistance + AWAY_THRESHOLD_M &&
      !guidance.awayWarned
    ) {
      guidance.awayWarned = true;
      guidance.lastCueAt = now;
      Vibration.vibrate(GUIDANCE_VIBRATION);
      return;
    }
    if (distance <= guidance.minDistance + 10) {
      guidance.awayWarned = false;
    }

    // Hitos de distancia
    const milestone = GUIDANCE_MILESTONES.find(
      m => distance <= m && !guidance.announcedMilestones.has(m),
    );
    if (milestone !== undefined) {
      GUIDANCE_MILESTONES.filter(m => m >= milestone).forEach(m =>
        guidance.announcedMilestones.add(m),
      );
      guidance.lastCueAt = now;
      Vibration.vibrate(GUIDANCE_VIBRATION);
    }
  };

  // --- C. Lógica Principal en el Callback de Ubicación ---
  const locationUpdateCallback = (position: Geolocation.GeoPosition) => {
    setCurrentPosition(position);

    const userCoords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    const locations = storyLocationsRef.current;
    const unplayed = locations.filter(s => !s.played);

    const nearestUnplayed: StoryLocation | null =
      unplayed.length === 0
        ? null
        : unplayed.reduce((nearest, loc) => {
            const d = getDistance(userCoords, {latitude: loc.latitude, longitude: loc.longitude});
            const dNearest = getDistance(userCoords, {latitude: nearest.latitude, longitude: nearest.longitude});
            return d < dNearest ? loc : nearest;
          });
    const nearestUnplayedDistance = nearestUnplayed
      ? getDistance(userCoords, {
          latitude: nearestUnplayed.latitude,
          longitude: nearestUnplayed.longitude,
        })
      : Infinity;

    // Llegada a la parada sin visitar más cercana. Si hay una audioguía
    // sonando no se marca todavía: cortar una narración a la mitad para
    // empezar otra es peor que esperar a la siguiente actualización de
    // posición, que llega en segundos.
    if (nearestUnplayed && nearestUnplayedDistance < PROXIMITY_RADIUS) {
      const arrivalStop = nearestUnplayed;
      if (isPlayingRef.current) {
        console.log(`Narración en curso. Se reintentará: ${arrivalStop.title}`);
      } else {
        markArrival(arrivalStop);
        const updated = locations.map(s =>
          s.id === arrivalStop.id ? {...s, played: true} : s,
        );
        storyLocationsRef.current = updated;
        setStoryLocations(updated);
        guidanceRef.current = freshGuidance();
        if (manualTargetIdRef.current === arrivalStop.id) {
          setManualTargetId(null);
        }
        return;
      }
    }

    // Objetivo de navegación: un punto elegido a mano ("Guíame aquí") tiene
    // prioridad sobre la parada sin visitar más cercana.
    const manualTargetLocation =
      manualTargetIdRef.current !== null
        ? locations.find(l => l.id === manualTargetIdRef.current) ?? null
        : null;
    const navTarget = manualTargetLocation ?? nearestUnplayed;

    if (!navTarget) {
      setDistanceToTarget(null);
      return;
    }

    const navDistance =
      navTarget === nearestUnplayed
        ? nearestUnplayedDistance
        : getDistance(userCoords, {
            latitude: navTarget.latitude,
            longitude: navTarget.longitude,
          });
    setDistanceToTarget(navDistance);

    // Llegada a un punto elegido a mano que ya estaba visitado (revisita):
    // solo se avisa y se libera el objetivo, sin volver a marcarlo.
    if (manualTargetLocation?.played && navDistance < PROXIMITY_RADIUS) {
      Vibration.vibrate(ARRIVAL_VIBRATION);
      setManualTargetId(null);
      return;
    }

    if (isGuideActiveRef.current) {
      runGuidanceFeedback(navTarget, navDistance);
    }
  };

  const startWatching = async () => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      Alert.alert(
        'Permiso Denegado',
        Platform.OS === 'ios'
          ? "El rastreo en segundo plano requiere permiso 'Siempre'."
          : 'El recorrido necesita acceso a tu ubicación para funcionar.',
      );
      return false;
    }

    if (watchId !== WATCH_ID_INITIAL) {
      Geolocation.clearWatch(watchId);
      setWatchId(WATCH_ID_INITIAL);
      setCurrentPosition(null);
    }

    const options = {
      enableHighAccuracy: true,
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
    return true;
  };

  const stopWatching = () => {
    if (watchId !== WATCH_ID_INITIAL) {
      Geolocation.clearWatch(watchId);
      setWatchId(WATCH_ID_INITIAL);
      setCurrentPosition(null);
      setDistanceToTarget(null);
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

  const manualTargetLocation =
    manualTargetId !== null
      ? storyLocations.find(l => l.id === manualTargetId) ?? null
      : null;
  // Objetivo mostrado en el mapa y en la tarjeta de progreso: el punto elegido
  // a mano ("Guíame aquí") tiene prioridad sobre la parada más cercana.
  const guidanceTarget = manualTargetLocation ?? nearestUnplayedLocation;

  const toggleGuide = () => {
    setIsGuideActive(prev => {
      const next = !prev;
      if (!next) {
        setManualTargetId(null);
      }
      return next;
    });
  };

  // --- "Guíame aquí": fuerza la guía por voz hacia un punto elegido en el
  // mapa, sin importar si es la parada más cercana sin visitar. ---
  const guideToLocation = (location: StoryLocation) => {
    guidanceRef.current = {...freshGuidance(), targetId: location.id};
    setManualTargetId(location.id);
    setIsGuideActive(true);
  };

  const onStart = async () => {
    const started = await startWatching();
    if (started) {
      // La guía por voz arranca activada: es la forma de seguir el recorrido
      // sin mirar la pantalla. El usuario puede apagarla con el botón.
      setIsGuideActive(true);
    }
  };
  const onFinish = () => {
    stopWatching();
    stopAudio();
    setIsGuideActive(false);
    setManualTargetId(null);
  };

  // Salir de la pantalla no debe dejar una narración sonando de fondo.
  useEffect(() => stopAudio, []);

  const playedCount = storyLocations.filter(l => l.played).length;


  const isTourActive = watchId !== WATCH_ID_INITIAL;
  const isTourComplete = audioProgress.total > 0 && playedCount === audioProgress.total;

  // El recorrido no arranca hasta tener el audio en disco: salir a caminar con
  // una guía a medio bajar es justo lo que la descarga previa evita.
  const isAudioReady =  audioStatus === 'ready';
  const isDownloading =  audioStatus === 'downloading';
  const {completed, total} =  audioProgress;

  return {
    state: {
      currentPosition,
      error,
      watchId,
      appState,
      storyLocations,
      isGuideActive,
      nearestUnplayedLocation,
      guidanceTarget,
      isManualGuidance: manualTargetLocation !== null,
      distanceToTarget,
      playedCount,
      totalCount: storyLocations.length,
      lang,
      isAudioBusy,
      audioStatus,
      audioProgress,
      // Paradas que sí quedaron con audio en disco: es lo que la pantalla
      // necesita para decir "8 de 10 con audio" sin recorrer la lista.
      audioReadyCount: audioPoints.filter(p => p.localPath !== null).length,
      audioTotalSeconds: audioPoints.reduce((sum, p) => sum + p.durationSeconds, 0),


      guide,
      isTourActive,
      isTourComplete,
      isAudioReady,
      isDownloading,
      completed,
      total,
    },
    actions: {
      onStart,
      onFinish,
      toggleGuide,
      guideToLocation,
      downloadGuideAudio,

      onBack,
    },
  };
};

export default useMainHook;
