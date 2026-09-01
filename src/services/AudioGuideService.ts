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
  /** Igual al `title` de la parada en Airtable: es lo único que une ambas fuentes. */
  stopName: string;
  durationSeconds: number;
  storagePath: string;
  /** Firmada y de vida corta (`expires_in`). No sirve para guardar en disco. */
  audioUrl: string | null;
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
}

interface ApiResponse {
  user_id: string;
  cities: {slug: string; name: string; guides: {id: string; name: string; points: ApiPoint[]}[]}[];
}

// El API identifica cada guía con un uuid propio, pero la app navega con el
// "Internal ID" de Airtable (`bog-0102`), que es de donde salen las
// coordenadas del mapa. Hoy lo único que une ambos mundos es el nombre del
// archivo, que arranca con ese Internal ID:
//
//   bogota/es/bog-0102_plaza-de-bolivar_es.wav
//
// Está aislado en una función a propósito: en cuanto el API exponga el Internal
// ID (o la app navegue con el uuid), esto se reemplaza por comparar ids y se
// borra de aquí.
const belongsToGuide = (storagePath: string, guideId: string): boolean =>
  (storagePath.split('/').pop() ?? '').startsWith(`${guideId}_`);

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

  // El endpoint devuelve todas las ciudades compradas, y hoy además ignora el
  // `?lng`, así que el filtro por idioma se repite aquí. Cuando el API lo
  // respete, este filtro sigue siendo correcto — solo deja de hacer falta.
  return data.cities
    .flatMap(city => city.guides)
    .flatMap(guide => guide.points)
    .filter(
      point =>
        point.language === lang && belongsToGuide(point.storage_path, guideId),
    )
    .map(point => ({
      trackId: point.id,
      stopName: point.stop_name,
      durationSeconds: point.duration_seconds,
      storagePath: point.storage_path,
      audioUrl: point.audio_url,
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
    const target = localPathFor(point.storagePath);
    let localPath: string | null = null;

    if (await RNFS.exists(target)) {
      localPath = target;
    } else {
      const url = urlByPath.get(point.storagePath) ?? null;

      if (url === null) {
        // El API devuelve audio_url null cuando la fila apunta a un objeto que
        // todavía no está en el bucket. La parada existe y se dibuja en el
        // mapa; simplemente no tiene audio que reproducir.
        console.warn(`[AudioGuide] sin audio disponible: ${point.storagePath}`);
      } else {
        let status = await downloadTo(url, target);

        // Las URLs firmadas viven `expires_in` segundos (5 min en desarrollo).
        // Una guía entera puede tardar más que eso por datos móviles, así que
        // al primer rechazo se pide el manifiesto de nuevo y se reintenta con
        // una URL fresca. Un reintento por parada: si la nueva también falla,
        // el problema no es la caducidad.
        if (STALE_URL_STATUSES.includes(status)) {
          const refreshed = await fetchAudioGuide(userId, guideId, lang);
          urlByPath = new Map(refreshed.map(p => [p.storagePath, p.audioUrl]));

          const retryUrl = urlByPath.get(point.storagePath);
          if (retryUrl) {
            status = await downloadTo(retryUrl, target);
          }
        }

        if (status === 200) {
          localPath = target;
        } else {
          console.warn(
            `[AudioGuide] ${point.storagePath} falló con HTTP ${status}`,
          );
        }
      }
    }

    results.push({
      trackId: point.trackId,
      stopName: point.stopName,
      durationSeconds: point.durationSeconds,
      storagePath: point.storagePath,
      localPath,
    });
    onProgress?.(index + 1, points.length);
  }

  await RNFS.mkdir(CACHE_ROOT);
  await RNFS.writeFile(manifestPathFor(guideId, lang), JSON.stringify(results), 'utf8');

  return results;
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
