import Tts from 'react-native-tts';
import { Platform } from 'react-native';

class TTSService {
  private static isInitialized = false;

  /**
   * Inicializa el motor TTS y configura los parámetros por defecto.
   */
  static async init() {
    try {
      await Tts.getInitStatus();
      this.isInitialized = true;
      
      // Configuración inicial
      await Tts.setDefaultLanguage('es-ES');
      await Tts.setDefaultRate(0.5);
      await Tts.setDefaultPitch(1.0);
      
      // Ignora el switch de silencio en iOS para asegurar reproducción
      if (Platform.OS === 'ios') {
        await Tts.setIgnoreSilentSwitch('ignore');
      }

      console.log('[TTSService] Inicializado correctamente');
      return true;
    } catch (error: any) {
      if (error.code === 'no_engine') {
        console.warn('[TTSService] No hay motor TTS instalado');
        if (Platform.OS === 'android') {
          Tts.requestInstallEngine();
        }
      }
      console.error('[TTSService] Error al inicializar:', error);
      return false;
    }
  }

  /**
   * Verifica si las voces para español están disponibles y gatilla descarga en Android si es necesario.
   */
  static async checkSpanishVoices() {
    const voices = await Tts.voices();
    const spanishVoice = voices.find(v => v.language.startsWith('es'));

    if (!spanishVoice) {
      if (Platform.OS === 'android') {
        console.log('[TTSService] Voces en español no detectadas, solicitando descarga...');
        Tts.requestInstallData();
      }
      return false;
    }

    await Tts.setDefaultVoice(spanishVoice.id);
    console.log(`[TTSService] Voz española seleccionada: ${spanishVoice.name} (${spanishVoice.language})`);
    return true;
  }

  /**
   * Detiene cualquier locución en curso.
   */
  static stop() {
    Tts.stop();
  }
}

export default TTSService;
