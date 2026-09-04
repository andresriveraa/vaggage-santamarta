import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';
import {resolveApiBaseUrl} from './api';
import type {AppLang} from '../constants/lang';

Sound.setCategory('Playback');

// Raíz del caché en disco. Debajo se replica la ruta del bucket tal cual
// (`bogota/es/bog-0102_...wav`), para que un archivo en el dispositivo sea
// rastreable hasta su objeto en Storage sin tener que adivinar.
const CACHE_ROOT = `${RNFS.DocumentDirectoryPath}/audio-guides`;

// Supabase Storage responde 400 a una URL firmada vencida, y 401/403 si el
// token viene mal. Los tres se tratan igual: pedir el manifiesto de nuevo.
const STALE_URL_STATUSES = [400, 401, 403];

export interface AudioGuidePoint {
  trackId: number;
  stopName: string;
  durationSeconds: number;
  storagePath: string;
  /** Firmada y de vida corta (`expires_in`). No sirve para guardar en disco. */
  audioUrl: string | null;
  latitude: number;
  longitude: number;
}

/**
 * Un punto ya resuelto contra el caché. Deliberadamente sin `audioUrl`: esa
 * URL caduca en minutos, y nada de lo que sobreviva a la descarga debería
 * poder guardarla por accidente.
 */
export interface CachedAudioGuidePoint
  extends Omit<AudioGuidePoint, 'audioUrl'> {
  /** Ruta en disco, o null si el punto todavía no tiene audio descargable. */
  localPath: string | null;
}

interface ApiPoint {
  id: number;
  stop_name: string;
  language: string;
  duration_seconds: number;
  storage_path: string;
  audio_url: string | null;
  expires_in: number;
  latitude: number;
  longitude: number;
}

interface ApiResponse {
  user_id: string;
  cities: {slug: string; name: string; guides: {id: string; name: string; points: ApiPoint[]}[]}[];
}

export const localPathFor = (storagePath: string): string =>
  `${CACHE_ROOT}/${storagePath}`;

const manifestPathFor = (guideId: string, lang: AppLang): string =>
  `${CACHE_ROOT}/${guideId}.${lang}.json`;

/**
 * Lo que quedó descargado de una guía, leído de disco.
 *
 * Es lo que permite abrir una guía sin señal: el manifiesto del API necesita
 * internet, este no. Devuelve null si nunca se descargó.
 */
export const loadCachedAudioGuide = async (
  guideId: string,
  lang: AppLang,
): Promise<CachedAudioGuidePoint[] | null> => {
  const path = manifestPathFor(guideId, lang);
  if (!(await RNFS.exists(path))) {
    return null;
  }

  try {
    const points: CachedAudioGuidePoint[] = JSON.parse(
      await RNFS.readFile(path, 'utf8'),
    );

    // Un archivo pudo desaparecer entre sesiones (limpieza del sistema, el
    // usuario liberando espacio), así que se verifica antes de prometer que la
    // guía está lista para caminarse.
    return await Promise.all(
      points.map(async point => ({
        ...point,
        localPath:
          point.localPath && (await RNFS.exists(point.localPath))
            ? point.localPath
            : null,
      })),
    );
  } catch (error) {
    console.warn(`[AudioGuide] manifiesto local ilegible (${path}):`, error);
    return null;
  }
};

/**
 * Pide el manifiesto de la guía: las paradas con audio y una URL firmada por
 * cada una. Las URLs caducan, así que esto se vuelve a llamar cada vez que
 * hace falta descargar, no una sola vez al abrir la app.
 */
export const fetchAudioGuide = async (
  userId: string,
  guideId: string,
  lang: AppLang,
): Promise<AudioGuidePoint[]> => {
  const response = await fetch(
    `${resolveApiBaseUrl()}/users/${userId}/guides?lng=${lang}&status=completed`,
  );

  if (!response.ok) {
    throw new Error(`Audio guide fetch failed: ${response.status}`);
  }

  const data: ApiResponse = await response.json();
  const guide = data.cities.flatMap(city => city.guides).find(g => g.id === guideId);

  // El endpoint devuelve todas las ciudades compradas, y hoy además ignora el
  // `?lng`, así que el filtro por idioma se repite aquí. Cuando el API lo
  // respete, este filtro sigue siendo correcto — solo deja de hacer falta.
  return (guide?.points ?? [])
    .filter(point => point.language === lang)
    .map(point => ({
      trackId: point.id,
      stopName: point.stop_name,
      durationSeconds: point.duration_seconds,
      storagePath: point.storage_path,
      audioUrl: point.audio_url,
      latitude: point.latitude,
      longitude: point.longitude,
    }));
};

// Descarga a un archivo temporal y renombra al terminar. Si la app muere a
// media descarga, lo que queda en disco es un `.part` y no un audio truncado
// que el caché daría por bueno en el próximo arranque.
const downloadTo = async (url: string, target: string): Promise<number> => {
  const partial = `${target}.part`;
  await RNFS.mkdir(target.slice(0, target.lastIndexOf('/')));

  try {
    const {statusCode} = await RNFS.downloadFile({
      fromUrl: url,
      toFile: partial,
    }).promise;

    if (statusCode === 200) {
      await RNFS.moveFile(partial, target);
    }
    return statusCode;
  } finally {
    if (await RNFS.exists(partial)) {
      await RNFS.unlink(partial).catch(() => {});
    }
  }
};

// Resuelve el archivo local de UNA parada: si ya está en disco lo usa tal
// cual, si no, descarga con la URL firmada del punto y reintenta una vez con
// una fresca (`refetchUrl`) si esa URL ya caducó. Compartido entre la
// descarga masiva de la guía y la descarga puntual de una sola parada.
const resolvePointLocalPath = async (
  point: AudioGuidePoint,
  refetchUrl: () => Promise<string | null>,
): Promise<string | null> => {
  const target = localPathFor(point.storagePath);

  if (await RNFS.exists(target)) {
    return target;
  }

  if (point.audioUrl === null) {
    // El API devuelve audio_url null cuando la fila apunta a un objeto que
    // todavía no está en el bucket. La parada existe y se dibuja en el
    // mapa; simplemente no tiene audio que reproducir.
    console.warn(`[AudioGuide] sin audio disponible: ${point.storagePath}`);
    return null;
  }

  let status = await downloadTo(point.audioUrl, target);

  // Las URLs firmadas viven `expires_in` segundos (5 min en desarrollo). Al
  // primer rechazo se pide una URL fresca y se reintenta una sola vez: si la
  // nueva también falla, el problema no es la caducidad.
  if (STALE_URL_STATUSES.includes(status)) {
    const freshUrl = await refetchUrl();
    if (freshUrl) {
      status = await downloadTo(freshUrl, target);
    }
  }

  if (status === 200) {
    return target;
  }

  console.warn(`[AudioGuide] ${point.storagePath} falló con HTTP ${status}`);
  return null;
};

/**
 * Deja la guía completa en disco y devuelve cada parada con su ruta local.
 *
 * Lo que ya estaba descargado no se vuelve a bajar, así que llamarla de nuevo
 * es barato y sirve para reanudar una descarga interrumpida.
 */
export const downloadAudioGuide = async (
  userId: string,
  guideId: string,
  lang: AppLang,
  onProgress?: (completed: number, total: number) => void,
): Promise<CachedAudioGuidePoint[]> => {
  const points = await fetchAudioGuide(userId, guideId, lang);
  let urlByPath = new Map(points.map(p => [p.storagePath, p.audioUrl]));

  const results: CachedAudioGuidePoint[] = [];

  for (const [index, point] of points.entries()) {
    const localPath = await resolvePointLocalPath(point, async () => {
      const refreshed = await fetchAudioGuide(userId, guideId, lang);
      urlByPath = new Map(refreshed.map(p => [p.storagePath, p.audioUrl]));
      return urlByPath.get(point.storagePath) ?? null;
    });

    results.push({
      trackId: point.trackId,
      stopName: point.stopName,
      durationSeconds: point.durationSeconds,
      storagePath: point.storagePath,
      latitude: point.latitude,
      longitude: point.longitude,
      localPath,
    });
    onProgress?.(index + 1, points.length);
  }

  await RNFS.mkdir(CACHE_ROOT);
  await RNFS.writeFile(manifestPathFor(guideId, lang), JSON.stringify(results), 'utf8');

  return results;
};

/**
 * Descarga el audio de UNA sola parada (preview manual desde el mapa), sin
 * bajar el resto de la guía. Actualiza el manifiesto en disco para que la
 * próxima lectura de caché (`loadCachedAudioGuide`) ya la refleje.
 */
export const downloadAudioGuidePoint = async (
  userId: string,
  guideId: string,
  lang: AppLang,
  trackId: number,
): Promise<CachedAudioGuidePoint | null> => {
  const points = await fetchAudioGuide(userId, guideId, lang);
  const point = points.find(p => p.trackId === trackId);
  if (!point) {
    return null;
  }

  const localPath = await resolvePointLocalPath(point, async () => {
    const refreshed = await fetchAudioGuide(userId, guideId, lang);
    return refreshed.find(p => p.trackId === trackId)?.audioUrl ?? null;
  });

  const result: CachedAudioGuidePoint = {
    trackId: point.trackId,
    stopName: point.stopName,
    durationSeconds: point.durationSeconds,
    storagePath: point.storagePath,
    latitude: point.latitude,
    longitude: point.longitude,
    localPath,
  };

  const manifestPoints =
    (await loadCachedAudioGuide(guideId, lang)) ??
    points.map(p => ({
      trackId: p.trackId,
      stopName: p.stopName,
      durationSeconds: p.durationSeconds,
      storagePath: p.storagePath,
      latitude: p.latitude,
      longitude: p.longitude,
      localPath: null,
    }));

  const merged = manifestPoints.some(p => p.trackId === trackId)
    ? manifestPoints.map(p => (p.trackId === trackId ? result : p))
    : [...manifestPoints, result];

  await RNFS.mkdir(CACHE_ROOT);
  await RNFS.writeFile(manifestPathFor(guideId, lang), JSON.stringify(merged), 'utf8');

  return result;
};

let currentSound: Sound | null = null;
let currentResolve: (() => void) | null = null;

// Cierra la reproducción en curso: libera el recurso nativo y resuelve la
// promesa de playAudioFile. `Sound.play` no invoca su callback cuando el audio
// se detiene desde fuera, así que sin esto quien esperaba se quedaría colgado.
const settle = (): void => {
  currentSound?.release();
  currentSound = null;
  const resolve = currentResolve;
  currentResolve = null;
  resolve?.();
};

export const stopAudio = (): void => {
  currentSound?.stop();
  settle();
};

/**
 * Reproduce un archivo ya descargado y espera a que termine. Una audioguía a
 * la vez: llamarla de nuevo corta la anterior.
 */
export const playAudioFile = (localPath: string): Promise<void> =>
  new Promise<void>(resolve => {
    stopAudio();
    currentResolve = resolve;

    const sound = new Sound(localPath, '', error => {
      // El archivo se carga de forma asíncrona: para cuando llega aquí, puede
      // que ya nos hayan pedido detener o reproducir otra cosa.
      if (currentResolve !== resolve) {
        sound.release();
        return;
      }
      if (error) {
        console.warn(`[AudioGuide] no se pudo cargar ${localPath}:`, error);
        settle();
        return;
      }

      currentSound = sound;
      sound.play(() => settle());
    });
  });

/** Borra todos los audios descargados. La guía se puede volver a bajar. */
export const clearAudioGuideCache = async (): Promise<void> => {
  stopAudio();
  if (await RNFS.exists(CACHE_ROOT)) {
    await RNFS.unlink(CACHE_ROOT);
  }
};
