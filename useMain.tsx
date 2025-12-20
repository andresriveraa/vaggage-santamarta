import {useState, useEffect} from 'react';
import {Platform, Alert, AppState} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Sound from 'react-native-sound';
import {getDistance} from 'geolib';
import {initialStoryLocations} from './src/data/mock-data-location';

export const WATCH_ID_INITIAL = null;
const PROXIMITY_RADIUS = 50; // 50 metros de radio para la detección
const AUDIO_COOLDOWN_MS = 10000; // 10 segundos de pausa para evitar repeticiones/superposiciones

// Configuración de Sound (Requerido por react-native-sound)
Sound.setCategory('Playback', true);

// business logic
// ui logic
// data logic

const useMainHook = () => {
  const [watchId, setWatchId] = useState<number | null>(WATCH_ID_INITIAL);
  const [currentPosition, setCurrentPosition] =
    useState<Geolocation.GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storyLocations, setStoryLocations] = useState(initialStoryLocations);
  const [isAudioLocked, setIsAudioLocked] = useState(false); // Bloqueo de audio
  const [appState, setAppState] = useState<string>('');
  AppState.addEventListener('change', setAppState);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('always');
      return auth === 'granted';
      // return true;
    }
    return false; // Por defecto para otros sistemas operativos
  };

  // --- Función de Reproducción de Audio (react-native-sound) ---
  const playStoryAudio = (audioFileName: string, storyTitle: string) => {
    if (isAudioLocked) {
      console.log(`Audio bloqueado. Saltando reproducción de: ${storyTitle}`);
      return;
    }

    // 1. Bloqueo de audio para evitar superposiciones (opcional)
    setIsAudioLocked(true);
    setTimeout(() => {
      setIsAudioLocked(false);
      console.log('Bloqueo de audio liberado.');
    }, AUDIO_COOLDOWN_MS);

    // 2. Cargar y Reproducir
    const sound = new Sound(audioFileName, Sound.MAIN_BUNDLE, errorSound => {
      if (errorSound) {
        console.log(`Fallo al cargar el audio: ${audioFileName}`, errorSound);
        Alert.alert(
          'Error de Audio',
          `No se pudo cargar el archivo: ${audioFileName}`,
        );
        setIsAudioLocked(false); // Liberar bloqueo si hay error de carga
        return;
      }

      Alert.alert('Historia Cercana', `Reproduciendo: ${storyTitle}`);
      console.log(`Reproduciendo audio: ${storyTitle}`);

      sound.play(success => {
        if (success) {
          console.log('Audio finalizado con éxito.');
        } else {
          console.log('Fallo en la reproducción del audio.');
        }
        sound.release(); // Liberar recursos
      });
    });
  };

  // --- C. Lógica Principal en el Callback de Ubicación ---
  const locationUpdateCallback = (position: Geolocation.GeoPosition) => {
    // 1. Actualizar la posición actual
    setCurrentPosition(position);
    console.log(
      `Posición actualizada: ${position.coords.latitude}, ${position.coords.longitude}`,
    );

    const userCoords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    // 2. Iteración y Validación
    setStoryLocations(prevLocations =>
      prevLocations.map(story => {
        // Si la historia ya fue reproducida, la saltamos
        if (story.played) {
          return story;
        }

        // A. Cálculo de Distancia (Fórmula de Haversine via geolib)
        const distanceInMeters = getDistance(userCoords, {
          latitude: story.latitude,
          longitude: story.longitude,
        });

        console.log(
          `Distancia a "${story.title}": ${distanceInMeters.toFixed(2)}m`,
        );

        // 3. Validación: Si la distancia es menor al radio (50m)
        if (distanceInMeters < PROXIMITY_RADIUS) {
          // Reproducción:
          playStoryAudio(story.audioFile, story.title);
          // Marcar como played: true
          return {...story, played: true};
        }

        return story;
      }),
    );
  };

  const startWatching = async () => {
    // 1. Solicita Permisos
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

    // Si ya estamos observando, primero detenemos la observación anterior.
    if (watchId !== WATCH_ID_INITIAL) {
      Geolocation.clearWatch(watchId);
      setWatchId(WATCH_ID_INITIAL);
      setCurrentPosition(null);
    }

    // Configuración para la observación (Requisito 2)
    // - enableHighAccuracy: false (precisión media para ahorrar batería)
    // - distanceFilter: 50 (actualiza la posición solo si el usuario se ha movido 50 metros)
    const options = {
      enableHighAccuracy: false, // Precisión media
      timeout: 15000,
      maximumAge: 10000,
      distanceFilter: 1, // Actualiza solo si se mueve 50 metros
      forceRequestLocation: true, // Fuerza la solicitud de ubicación si es necesario (Android)
      useSignificantChanges: false, // Usar watchPosition en lugar de la API de cambios significativos
      pausesLocationUpdatesAutomatically: false, // iOS: Evita que el sistema detenga las actualizaciones
      showsBackgroundLocationIndicator: true, // iOS: Muestra el indicador azul de ubicación
      foregroundService: true,
    };

    // Comienza a observar la posición del usuario
    console.log('Iniciando la observación de la posición...');

    const newWatchId = Geolocation.watchPosition(
      // position => {
      //   // Éxito: Se obtiene la nueva posición
      //   console.log('Nueva Posición:', position);
      //   setCurrentPosition(position);
      //   setError(null);
      // },
      locationUpdateCallback,
      geoError => {
        // Error: No se pudo obtener la posición
        console.log('Error de Geolocalización:', geoError);
        setError(geoError.message);

        // Detener la observación en caso de error grave
        Geolocation.clearWatch(newWatchId);
        setWatchId(WATCH_ID_INITIAL);
        setCurrentPosition(null);

        Alert.alert(
          'Error de Ubicación',
          `No se pudo obtener la ubicación: ${geoError.message}`,
        );
      },
      options, // Pasa las opciones configuradas
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

  // Limpia el watch en el desmontaje del componente
  useEffect(() => {
    return () => {
      if (watchId !== WATCH_ID_INITIAL) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]); // Dependencia del watchId

  const onStart = async () => {
    await startWatching();
  };
  const onFinish = () => {
    stopWatching();
  };

  return {
    state: {
      currentPosition,
      error,
      watchId,
      appState,
    },
    actions: {
      onStart,
      onFinish,
    },
  };
};

export default useMainHook;
