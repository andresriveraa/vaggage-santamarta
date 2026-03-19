import TTSManager from 'react-native-sherpa-onnx-offline-tts';
import RNFS from 'react-native-fs';
import type { EmitterSubscription } from 'react-native';

export type TTSLang = 'es' | 'en';

const MODEL_DIR = RNFS.MainBundlePath;

const MODELS: Record<TTSLang, { onnx: string; tokens: string }> = {
  es: { onnx: 'es_ES-miro-high.onnx', tokens: 'tokens_es.txt' },
  en: { onnx: 'en_US-lessac-medium.onnx', tokens: 'tokens_en.txt' },
};

let volumeSubscription: EmitterSubscription | null = null;
let currentLang: TTSLang | null = null;
let speakAborted = false;

export const VOLUME_MIN  = 0.5;
export const VOLUME_MAX  = 3.0;
export const VOLUME_STEP = 0.5;

let ttsGain = 1.0;
export function setTTSVolume(v: number): void {
  ttsGain = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, +v.toFixed(1)));
}
export function getTTSVolume(): number { return ttsGain; }

// ── 1. Inicializar el motor ──────────────────────────────────────
export async function initTTS(lang: TTSLang = 'es'): Promise<boolean> {
  if (currentLang === lang) { return true; }

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

// ── 2. Sintetizar y reproducir ───────────────────────────────────
export async function speak(text: string): Promise<void> {
  if (currentLang === null) {
    console.warn('[TTS] Motor no inicializado, ignorando speak');
    return;
  }
  speakAborted = false;
  console.log(`[TTS] speak: ${text.length} chars`);
  try {
    await TTSManager.generateAndPlay(text, 0, 1.0);
  } catch (e) {
    console.error('[TTS] Error en generateAndPlay:', e);
  }
}

// ── 2b. Señal para cancelar entre reproducciones ─────────────────
export function abortSpeak(): void {
  speakAborted = true;
}

export function isSpeakAborted(): boolean {
  return speakAborted;
}

// ── 3. Detener ───────────────────────────────────────────────────
export async function stopSpeaking(): Promise<void> {
  try { await TTSManager.deinitialize(); } catch (e) {
    console.error('[TTS] Error en deinitialize:', e);
  }
  currentLang = null;
}

// ── 4. Liberar recursos al desmontar el componente ───────────────
export async function releaseTTS(): Promise<void> {
  volumeSubscription?.remove();
  volumeSubscription = null;
  try { await TTSManager.deinitialize(); } catch (e) {
    console.error('[TTS] Error en deinitialize (release):', e);
  }
  currentLang = null;
}
