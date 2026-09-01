// Idioma de la app. Rige los textos de la interfaz, cuál descripción se muestra
// de cada parada y el `lng` con el que se piden las audioguías al API.
//
// Antes vivía en `src/services/tts-sherpa.ts` como `TTSLang`, cuando el idioma
// solo servía para elegir el modelo de voz. Ahora que la narración viene en
// audio pregrabado, el idioma es una preferencia de la app y no depende del TTS.
export type AppLang = 'es' | 'en';

export function isAppLang(value: unknown): value is AppLang {
  return value === 'es' || value === 'en';
}
