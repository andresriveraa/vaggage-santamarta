import { useState, useEffect, useCallback, useRef } from 'react';
import Tts from 'react-native-tts';
import { NativeModules } from 'react-native';
import TTSService from '../services/TTSService';

const isTTSAvailable = !!NativeModules.TextToSpeech;

export type TTSStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'error';

export const useTTS = () => {
  const [status, setStatus] = useState<TTSStatus>('loading');
  const [currentText, setCurrentText] = useState<string>('');
  const speechIdRef = useRef<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const success = await TTSService.init();
      if (success) {
        await TTSService.checkSpanishVoices();
        setStatus('ready');
      } else {
        setStatus('error');
      }
    };

    initialize();

    if (!isTTSAvailable) {
      console.warn('[useTTS] Módulo nativo TextToSpeech no disponible');
      return;
    }

    // Listeners de eventos
    const onStart = (event: any) => {
      console.log('[useTTS] Start:', event);
      setStatus('playing');
    };

    const onFinish = (event: any) => {
      console.log('[useTTS] Finish:', event);
      setStatus('ready');
      speechIdRef.current = null;
    };

    const onCancel = (event: any) => {
      console.log('[useTTS] Cancel:', event);
      setStatus('ready');
      speechIdRef.current = null;
    };

    const onPause = (event: any) => {
      console.log('[useTTS] Pause:', event);
      setStatus('paused');
    };

    const onResume = (event: any) => {
      console.log('[useTTS] Resume:', event);
      setStatus('playing');
    };

    Tts.addEventListener('tts-start', onStart);
    Tts.addEventListener('tts-finish', onFinish);
    Tts.addEventListener('tts-cancel', onCancel);
    Tts.addEventListener('tts-pause', onPause);
    Tts.addEventListener('tts-resume', onResume);

    return () => {
      Tts.removeEventListener('tts-start', onStart);
      Tts.removeEventListener('tts-finish', onFinish);
      Tts.removeEventListener('tts-cancel', onCancel);
      Tts.removeEventListener('tts-pause', onPause);
      Tts.removeEventListener('tts-resume', onResume);
      Tts.stop();
    };
  }, []);

  /**
   * Divide un texto largo en segmentos más pequeños para mejorar la fluidez.
   */
  const segmentText = (text: string): string[] => {
    // Divide por puntos, puntos y coma, o signos de exclamación/interrogación
    // sin exceder ~400 caracteres
    return text.match(/[^.!?]+[.!?]+|\S+/g) || [text];
  };

  const speak = useCallback(async (text: string) => {
    if (status === 'error') return;

    try {
      await Tts.stop();
      setCurrentText(text);

      const segments = segmentText(text);
      
      // Encolar segmentos
      segments.forEach((segment) => {
        Tts.speak(segment.trim(), {
          rate: 0.5,
          androidParams: {
            KEY_PARAM_PAN: 0,
            KEY_PARAM_VOLUME: 1,
            KEY_PARAM_STREAM: 'STREAM_MUSIC',
          },
        });
      });

    } catch (error) {
      console.error('[useTTS] speak error:', error);
      setStatus('ready');
    }
  }, [status]);

  const stop = useCallback(() => {
    Tts.stop();
    setStatus('ready');
  }, []);

  const pause = useCallback(() => {
    Tts.pause();
  }, []);

  const resume = useCallback(() => {
    Tts.resume();
  }, []);

  return {
    status,
    currentText,
    speak,
    stop,
    pause,
    resume,
    isInitialized: status !== 'loading' && status !== 'error',
  };
};
