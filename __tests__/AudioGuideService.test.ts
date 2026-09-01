/**
 * @format
 */
import {beforeEach, describe, expect, it, jest} from '@jest/globals';

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/docs',
  exists: jest.fn(),
  mkdir: jest.fn(),
  moveFile: jest.fn(),
  unlink: jest.fn(),
  downloadFile: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock('react-native-sound', () => {
  const Sound: any = jest.fn();
  Sound.setCategory = jest.fn();
  return Sound;
});

import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';
import {
  downloadAudioGuide,
  fetchAudioGuide,
  loadCachedAudioGuide,
  playAudioFile,
  stopAudio,
} from '../src/services/AudioGuideService';

const fs = RNFS as jest.Mocked<typeof RNFS>;

// `Sound` se usa con `new`, así que el mock es un constructor: recibe la ruta,
// la base y el callback de carga, y devuelve el objeto de audio.
type SoundCtor = (
  path: string,
  base: string,
  onLoad: (error: unknown) => void,
) => object;

const mockSound = (impl: SoundCtor): void => {
  (Sound as unknown as {mockImplementation: (fn: SoundCtor) => void})
    .mockImplementation(impl);
};

const point = (
  id: number,
  stopName: string,
  file: string,
  overrides: Partial<{language: string; audio_url: string | null}> = {},
) => ({
  id,
  stop_name: stopName,
  language: 'es',
  duration_seconds: 45,
  storage_path: `bogota/es/${file}`,
  audio_url: `https://storage.test/${file}?token=fresh`,
  expires_in: 300,
  ...overrides,
});

// Réplica de la forma real de GET /users/:id/guides, incluyendo los casos que
// el servicio tiene que descartar: otra ciudad, otra guía y otro idioma.
const apiResponse = (points: ReturnType<typeof point>[]) => ({
  user_id: 'user-1',
  cities: [
    {
      slug: 'bogota',
      name: 'Bogotá',
      guides: [{id: 'uuid-1', name: 'Imperdibles en la ciudad', points}],
    },
    {
      slug: 'cartagena',
      name: 'Cartagena',
      guides: [
        {
          id: 'uuid-2',
          name: 'Otra guía',
          points: [point(99, 'Torre del Reloj', 'ctg-0101_torre-del-reloj_es.wav')],
        },
      ],
    },
  ],
});

const mockApi = (...responses: unknown[]) => {
  const fetchMock = jest.fn();
  for (const body of responses) {
    fetchMock.mockResolvedValueOnce({ok: true, json: async () => body} as never);
  }
  (global as any).fetch = fetchMock;
  return fetchMock;
};

const mockDownload = (...statusCodes: number[]) => {
  for (const statusCode of statusCodes) {
    fs.downloadFile.mockReturnValueOnce({
      jobId: 1,
      promise: Promise.resolve({jobId: 1, statusCode, bytesWritten: 100}),
    } as never);
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  fs.exists.mockResolvedValue(false as never);
  fs.mkdir.mockResolvedValue(undefined as never);
  fs.moveFile.mockResolvedValue(undefined as never);
  fs.unlink.mockResolvedValue(undefined as never);
  fs.writeFile.mockResolvedValue(undefined as never);
});

describe('fetchAudioGuide', () => {
  it('se queda solo con las paradas de la guía pedida', async () => {
    mockApi(
      apiResponse([
        point(1, 'Plaza de Bolívar', 'bog-0102_plaza-de-bolivar_es.wav'),
        // Otra guía de la misma ciudad: el prefijo del archivo la delata.
        point(2, 'Museo del Oro', 'bog-0104_museo-del-oro_es.wav'),
      ]),
    );

    const points = await fetchAudioGuide('user-1', 'bog-0102', 'es');

    expect(points).toEqual([
      {
        trackId: 1,
        stopName: 'Plaza de Bolívar',
        durationSeconds: 45,
        storagePath: 'bogota/es/bog-0102_plaza-de-bolivar_es.wav',
        audioUrl: 'https://storage.test/bog-0102_plaza-de-bolivar_es.wav?token=fresh',
      },
    ]);
  });

  it('descarta otro idioma aunque el API ignore el ?lng', async () => {
    mockApi(
      apiResponse([
        point(1, 'Plaza de Bolívar', 'bog-0102_plaza-de-bolivar_es.wav'),
        point(2, 'Plaza de Bolívar', 'bog-0102_plaza-de-bolivar_en.wav', {
          language: 'en',
        }),
      ]),
    );

    const points = await fetchAudioGuide('user-1', 'bog-0102', 'es');

    expect(points.map(p => p.storagePath)).toEqual([
      'bogota/es/bog-0102_plaza-de-bolivar_es.wav',
    ]);
  });

  // La base viene de `@env`, que babel sustituye en tiempo de compilación: se
  // afirma sobre la ruta y los parámetros, no sobre el host de la máquina.
  it('pide el idioma y solo las compras completadas', async () => {
    const fetchMock = mockApi(apiResponse([]));

    await fetchAudioGuide('user-1', 'bog-0102', 'en');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/user-1/guides?lng=en&status=completed'),
    );
  });

  it('falla fuerte si el API responde con error', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ok: false, status: 503} as never);

    await expect(fetchAudioGuide('user-1', 'bog-0102', 'es')).rejects.toThrow(
      'Audio guide fetch failed: 503',
    );
  });
});

describe('downloadAudioGuide', () => {
  it('descarga a un .part y renombra al terminar', async () => {
    mockApi(apiResponse([point(1, 'Plaza de Bolívar', 'bog-0102_plaza-de-bolivar_es.wav')]));
    mockDownload(200);

    const result = await downloadAudioGuide('user-1', 'bog-0102', 'es');

    const target = '/docs/audio-guides/bogota/es/bog-0102_plaza-de-bolivar_es.wav';
    expect(fs.downloadFile).toHaveBeenCalledWith({
      fromUrl: 'https://storage.test/bog-0102_plaza-de-bolivar_es.wav?token=fresh',
      toFile: `${target}.part`,
    });
    expect(fs.moveFile).toHaveBeenCalledWith(`${target}.part`, target);
    expect(result[0].localPath).toBe(target);
    // La URL firmada no debe sobrevivir a la descarga.
    expect(result[0]).not.toHaveProperty('audioUrl');
    // El manifiesto local es lo que permite reabrir la guía sin señal.
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/docs/audio-guides/bog-0102.es.json',
      JSON.stringify(result),
      'utf8',
    );
  });

  it('no vuelve a bajar lo que ya está en caché', async () => {
    mockApi(apiResponse([point(1, 'Plaza de Bolívar', 'bog-0102_plaza-de-bolivar_es.wav')]));
    fs.exists.mockResolvedValue(true as never);

    const result = await downloadAudioGuide('user-1', 'bog-0102', 'es');

    expect(fs.downloadFile).not.toHaveBeenCalled();
    expect(result[0].localPath).toBe(
      '/docs/audio-guides/bogota/es/bog-0102_plaza-de-bolivar_es.wav',
    );
  });

  it('renueva el manifiesto y reintenta cuando la URL firmada venció', async () => {
    const stale = point(1, 'Plaza de Bolívar', 'bog-0102_plaza-de-bolivar_es.wav');
    const fresh = {
      ...stale,
      audio_url: 'https://storage.test/bog-0102_plaza-de-bolivar_es.wav?token=renovada',
    };
    const fetchMock = mockApi(apiResponse([stale]), apiResponse([fresh]));
    mockDownload(400, 200);

    const result = await downloadAudioGuide('user-1', 'bog-0102', 'es');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fs.downloadFile).toHaveBeenLastCalledWith(
      expect.objectContaining({fromUrl: fresh.audio_url}),
    );
    expect(result[0].localPath).not.toBeNull();
  });

  it('deja localPath en null si el reintento tampoco funciona', async () => {
    const p = point(1, 'Plaza de Bolívar', 'bog-0102_plaza-de-bolivar_es.wav');
    mockApi(apiResponse([p]), apiResponse([p]));
    mockDownload(400, 400);

    const result = await downloadAudioGuide('user-1', 'bog-0102', 'es');

    expect(result[0].localPath).toBeNull();
    expect(fs.moveFile).not.toHaveBeenCalled();
  });

  it('sobrevive a una parada sin audio en el bucket', async () => {
    mockApi(
      apiResponse([
        point(1, 'Plaza de Bolívar', 'bog-0102_plaza-de-bolivar_es.wav'),
        point(2, 'Museo del Oro', 'bog-0102_museo-del-oro_es.wav', {audio_url: null}),
      ]),
    );
    mockDownload(200);

    const result = await downloadAudioGuide('user-1', 'bog-0102', 'es');

    expect(fs.downloadFile).toHaveBeenCalledTimes(1);
    expect(result.map(p => p.localPath !== null)).toEqual([true, false]);
    expect(result[1].stopName).toBe('Museo del Oro');
  });

  it('reporta el avance parada por parada', async () => {
    mockApi(
      apiResponse([
        point(1, 'Plaza de Bolívar', 'bog-0102_plaza-de-bolivar_es.wav'),
        point(2, 'Teatro Colón', 'bog-0102_teatro-colon_es.wav'),
      ]),
    );
    mockDownload(200, 200);
    const onProgress = jest.fn();

    await downloadAudioGuide('user-1', 'bog-0102', 'es', onProgress);

    expect(onProgress.mock.calls).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });
});

describe('loadCachedAudioGuide', () => {
  it('devuelve null si la guía nunca se descargó', async () => {
    fs.exists.mockResolvedValue(false as never);

    expect(await loadCachedAudioGuide('bog-0102', 'es')).toBeNull();
  });

  it('lee el manifiesto sin tocar la red', async () => {
    const cached = [
      {
        trackId: 1,
        stopName: 'Plaza de Bolívar',
        durationSeconds: 45,
        storagePath: 'bogota/es/bog-0102_plaza-de-bolivar_es.wav',
        localPath: '/docs/audio-guides/bogota/es/bog-0102_plaza-de-bolivar_es.wav',
      },
    ];
    const fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    fs.exists.mockResolvedValue(true as never);
    fs.readFile.mockResolvedValue(JSON.stringify(cached) as never);

    expect(await loadCachedAudioGuide('bog-0102', 'es')).toEqual(cached);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // El sistema puede liberar espacio por su cuenta: un manifiesto que promete
  // un archivo que ya no está haría que la parada sonara a nada.
  it('baja a null el punto cuyo archivo ya no está en disco', async () => {
    const manifest = '/docs/audio-guides/bog-0102.es.json';
    const audio = '/docs/audio-guides/bogota/es/bog-0102_plaza-de-bolivar_es.wav';
    fs.exists.mockImplementation((async (path: string) =>
      path === manifest) as never);
    fs.readFile.mockResolvedValue(
      JSON.stringify([
        {
          trackId: 1,
          stopName: 'Plaza de Bolívar',
          durationSeconds: 45,
          storagePath: 'bogota/es/bog-0102_plaza-de-bolivar_es.wav',
          localPath: audio,
        },
      ]) as never,
    );

    const points = await loadCachedAudioGuide('bog-0102', 'es');

    expect(points?.[0].localPath).toBeNull();
  });

  it('no explota si el manifiesto está corrupto', async () => {
    fs.exists.mockResolvedValue(true as never);
    fs.readFile.mockResolvedValue('{ esto no es json' as never);

    expect(await loadCachedAudioGuide('bog-0102', 'es')).toBeNull();
  });
});

describe('playAudioFile', () => {
  // `Sound.play` no llama a su callback cuando el audio se detiene desde
  // fuera, así que stopAudio() tiene que resolver la promesa a mano — si no,
  // quien esperaba el fin de la narración se cuelga para siempre.
  it('resuelve si se detiene en plena reproducción', async () => {
    const sound = {play: jest.fn(), stop: jest.fn(), release: jest.fn()};
    mockSound((_path, _base, onLoad) => {
      setImmediate(() => onLoad(null));
      return sound;
    });

    const playing = playAudioFile('/docs/audio-guides/x.wav');
    await new Promise(setImmediate); // deja que termine la carga
    stopAudio();

    await expect(playing).resolves.toBeUndefined();
    expect(sound.stop).toHaveBeenCalled();
    expect(sound.release).toHaveBeenCalled();
  });

  it('resuelve si el archivo no carga', async () => {
    const sound = {play: jest.fn(), stop: jest.fn(), release: jest.fn()};
    mockSound((_path, _base, onLoad) => {
      setImmediate(() => onLoad(new Error('corrupto')));
      return sound;
    });

    await expect(playAudioFile('/docs/audio-guides/roto.wav')).resolves.toBeUndefined();
    expect(sound.play).not.toHaveBeenCalled();
  });
});
