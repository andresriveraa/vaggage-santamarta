import TTSManager from 'react-native-sherpa-onnx-offline-tts';
import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';
import { Platform } from 'react-native';
import type { EmitterSubscription } from 'react-native';
import type { AppLang } from '../constants/lang';

Sound.setCategory('Playback');

// PARQUEADO: la narración ya no se genera con TTS en el dispositivo — las
// audioguías vienen como archivos de audio desde el API. Este módulo se
// conserva porque el idioma sigue siendo el mismo y la voz sintética vuelve a
// hacer falta para el acompañante conversacional. Nadie lo importa hoy.
export type TTSLang = AppLang;

// iOS: los modelos van como recursos del bundle. Android: van como assets del
// APK, pero sherpa-onnx necesita rutas reales de filesystem, así que se copian
// una sola vez a almacenamiento interno (ver ensureAndroidModels).
const MODEL_DIR =
  Platform.OS === 'android'
    ? `${RNFS.DocumentDirectoryPath}/tts`
    : RNFS.MainBundlePath;

const MODELS: Record<TTSLang, { onnx: string; tokens: string }> = {
  es: { onnx: 'es_ES-miro-high.onnx', tokens: 'tokens_es.txt' },
  en: { onnx: 'en_US-lessac-medium.onnx', tokens: 'tokens_en.txt' },
};

let volumeSubscription: EmitterSubscription | null = null;
let currentLang: TTSLang | null = null;
let speakAborted = false;
let currentSound: Sound | null = null;
let currentSoundPath: string | null = null;

export const VOLUME_MIN  = 0.5;
export const VOLUME_MAX  = 3.0;
export const VOLUME_STEP = 0.5;

let ttsGain = 1.0;
export function setTTSVolume(v: number): void {
  ttsGain = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, +v.toFixed(1)));
}
export function getTTSVolume(): number { return ttsGain; }

// Copia recursiva de un directorio de assets del APK al filesystem.
// RNFS.copyFileAssets solo copia archivos individuales, así que los
// directorios (espeak-ng-data tiene subcarpetas) se recorren a mano.
async function copyAssetDir(assetDir: string, destDir: string): Promise<void> {
  await RNFS.mkdir(destDir);
  const entries = await RNFS.readDirAssets(assetDir);
  for (const entry of entries) {
    const dest = `${destDir}/${entry.name}`;
    if (entry.isDirectory()) {
      await copyAssetDir(entry.path, dest);
    } else {
      await RNFS.copyFileAssets(entry.path, dest);
    }
  }
}

// Provisiona los archivos del modelo en Android copiándolos de los assets del
// APK a MODEL_DIR. Idempotente: solo copia lo que falte. espeak-ng-data usa un
// archivo marcador porque verificar sus ~120 archivos uno a uno sería lento.
async function ensureAndroidModels(lang: TTSLang): Promise<boolean> {
  const model = MODELS[lang];
  try {
    await RNFS.mkdir(MODEL_DIR);
    for (const file of [model.onnx, model.tokens]) {
      const dest = `${MODEL_DIR}/${file}`;
      if (!(await RNFS.exists(dest))) {
        console.log(`[TTS] Copiando asset ${file} a almacenamiento interno...`);
        await RNFS.copyFileAssets(file, dest);
      }
    }
    const espeakMarker = `${MODEL_DIR}/espeak-ng-data/.complete`;
    if (!(await RNFS.exists(espeakMarker))) {
      console.log('[TTS] Copiando espeak-ng-data a almacenamiento interno...');
      await copyAssetDir('espeak-ng-data', `${MODEL_DIR}/espeak-ng-data`);
      await RNFS.writeFile(espeakMarker, '1', 'utf8');
    }
    return true;
  } catch (e) {
    console.error('[TTS] Error copiando modelos desde assets:', e);
    return false;
  }
}

// ── 1. Inicializar el motor ──────────────────────────────────────
export async function initTTS(lang: TTSLang = 'es'): Promise<boolean> {
  if (currentLang === lang) { return true; }

  if (Platform.OS === 'android' && !(await ensureAndroidModels(lang))) {
    return false;
  }

  const model = MODELS[lang];
  const config = {
    modelPath:   `${MODEL_DIR}/${model.onnx}`,
    tokensPath:  `${MODEL_DIR}/${model.tokens}`,
    dataDirPath: `${MODEL_DIR}/espeak-ng-data`,
  };

  const onnxExists    = await RNFS.exists(config.modelPath);
  const tokensExists  = await RNFS.exists(config.tokensPath);
  const dataDirExists = await RNFS.exists(config.dataDirPath);
  console.log(`[TTS] init lang=${lang} onnx:${onnxExists} tokens:${tokensExists} dataDir:${dataDirExists}`);

  if (!onnxExists || !tokensExists || !dataDirExists) {
    console.error(`[TTS] Modelo ${lang} no disponible en el bundle`);
    return false;
  }

  try {
    if (!volumeSubscription) {
      volumeSubscription = TTSManager.addVolumeListener((_volume: number) => {});
    }
    await TTSManager.initialize(JSON.stringify(config));
    currentLang = lang;
    console.log(`[TTS] initialized (${lang})`);
    return true;
  } catch (e) {
    console.error(`[TTS] Error nativo al inicializar (${lang}):`, e);
    currentLang = null;
    return false;
  }
}

export function getCurrentLang(): TTSLang | null { return currentLang; }

// El wav generado es un scratch file de un solo uso: se borra apenas termina
// de reproducirse (o si se cancela) para no acumular archivos en cache.
function cleanupFile(path: string): void {
  RNFS.unlink(path).catch(() => {});
}

// Reproduce un archivo de audio ya generado y espera a que termine.
function playFile(path: string): Promise<void> {
  return new Promise(resolve => {
    if (speakAborted) {
      cleanupFile(path);
      resolve();
      return;
    }

    const sound = new Sound(path, '', error => {
      if (error) {
        console.error('[TTS] Error cargando audio generado:', error);
        cleanupFile(path);
        resolve();
        return;
      }
      if (speakAborted) {
        sound.release();
        cleanupFile(path);
        resolve();
        return;
      }

      currentSound = sound;
      currentSoundPath = path;
      sound.play(() => {
        sound.release();
        cleanupFile(path);
        if (currentSound === sound) {
          currentSound = null;
          currentSoundPath = null;
        }
        resolve();
      });
    });
  });
}

// ── 2. Sintetizar (texto completo) y reproducir ──────────────────
export async function speak(text: string): Promise<void> {
  if (currentLang === null) {
    console.warn('[TTS] Motor no inicializado, ignorando speak');
    return;
  }
  speakAborted = false;

  let filePath: string;
  try {
    console.log('[TTS] Generando audio completo...');
    filePath = await TTSManager.generateAndSave(text.trim());
    console.log(`[TTS] Audio generado en: ${filePath}`);
  } catch (e) {
    if (!speakAborted) {
      console.error('[TTS] Error en generateAndSave:', e);
    }
    return;
  }

  if (speakAborted) {
    console.log('[TTS] Reproducción cancelada antes de iniciar playback.');
    return;
  }

  await playFile(filePath);
}

// ── 2b. Señal para cancelar entre reproducciones ─────────────────
export function abortSpeak(): void {
  speakAborted = true;
  if (currentSound) {
    currentSound.stop();
    currentSound.release();
    currentSound = null;
    if (currentSoundPath) {
      cleanupFile(currentSoundPath);
      currentSoundPath = null;
    }
  }
}

export function isSpeakAborted(): boolean {
  return speakAborted;
}

// ── 3. Detener ───────────────────────────────────────────────────
export async function stopSpeaking(): Promise<void> {
  abortSpeak();
  try { await TTSManager.deinitialize(); } catch (e) {
    console.error('[TTS] Error en deinitialize:', e);
  }
  currentLang = null;
}

// ── 4. Liberar recursos al desmontar el componente ───────────────
export async function releaseTTS(): Promise<void> {
  abortSpeak();
  volumeSubscription?.remove();
  volumeSubscription = null;
  try { await TTSManager.deinitialize(); } catch (e) {
    console.error('[TTS] Error en deinitialize (release):', e);
  }
  currentLang = null;
}
