/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useMainHook, {WATCH_ID_INITIAL} from './useMain';
import type {TTSLang} from './useMain';
import {stylesApp} from './App.style';
import LocationsMap from './src/components/map/LocationsMap';
import Onboarding from './src/components/onboarding/Onboarding';

function LanguagePicker({onSelect}: {onSelect: (lang: TTSLang) => void}) {
  return (
    <View style={langStyles.container}>
      <Image
        source={require('./assets/brand/vaggage.png')}
        style={langStyles.logo}
        resizeMode="contain"
      />
      <Text style={langStyles.title}>Selecciona tu idioma</Text>
      <Text style={langStyles.subtitle}>Choose your language</Text>
      <View style={langStyles.buttons}>
        <Pressable
          style={langStyles.button}
          onPress={() => onSelect('es')}>
          <Text style={langStyles.flag}>ES</Text>
          <Text style={langStyles.langName}>Espanol</Text>
        </Pressable>
        <Pressable
          style={langStyles.button}
          onPress={() => onSelect('en')}>
          <Text style={langStyles.flag}>EN</Text>
          <Text style={langStyles.langName}>English</Text>
        </Pressable>
      </View>
    </View>
  );
}

function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ttsLang, setTtsLang] = useState<TTSLang | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    try {
      const [onboarding, savedLang] = await Promise.all([
        AsyncStorage.getItem('@onboarding_completed'),
        AsyncStorage.getItem('@tts_lang'),
      ]);
      if (onboarding !== 'true') {
        setShowOnboarding(true);
      }
      if (savedLang === 'es' || savedLang === 'en') {
        setTtsLang(savedLang);
      }
    } catch (error) {
      console.log('Error loading initial state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectLang = (lang: TTSLang) => {
    setTtsLang(lang);
  };

  const onFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        setShowOnboarding(false);
      });
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
  };

  const onTTSInitFailed = useCallback(() => {
    AsyncStorage.removeItem('@tts_lang');
    setTtsLang(null);
    Alert.alert(
      'Error',
      'No se pudo inicializar el idioma seleccionado. Por favor, intenta con otro idioma.',
    );
  }, []);

  const onTTSInitSuccess = useCallback(async (lang: TTSLang) => {
    await AsyncStorage.setItem('@tts_lang', lang);
  }, []);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (ttsLang === null) {
    return <LanguagePicker onSelect={onSelectLang} />;
  }

  return <MainApp ttsLang={ttsLang} showOnboarding={showOnboarding}
    fadeAnim={fadeAnim} onFinishOnboarding={onFinishOnboarding}
    onChangeLang={() => setTtsLang(null)}
    onTTSInitFailed={onTTSInitFailed}
    onTTSInitSuccess={onTTSInitSuccess} />;
}

function MainApp({ttsLang, showOnboarding, fadeAnim, onFinishOnboarding, onChangeLang, onTTSInitFailed, onTTSInitSuccess}: {
  ttsLang: TTSLang;
  showOnboarding: boolean;
  fadeAnim: Animated.Value;
  onFinishOnboarding: () => void;
  onChangeLang: () => void;
  onTTSInitFailed: () => void;
  onTTSInitSuccess: (lang: TTSLang) => void;
}) {
  const onTTSInitResult = useCallback((success: boolean) => {
    if (success) {
      onTTSInitSuccess(ttsLang);
    } else {
      onTTSInitFailed();
    }
  }, [ttsLang, onTTSInitSuccess, onTTSInitFailed]);

  const {state, actions} = useMainHook(ttsLang, onTTSInitResult);
  const [onboardingVisible, setOnboardingVisible] = useState(showOnboarding);

  return (
    <View style={stylesApp.container}>
      {/* Map Layer */}
      <View style={stylesApp.locationMap}>
        <LocationsMap
          currentPosition={state.currentPosition ?? undefined}
          storyLocations={state.storyLocations}
          targetLocation={state.isGuideActive ? state.nearestUnplayedLocation : null}
        />
      </View>

      {/* Top Overlay: Branding */}
      <View style={stylesApp.topOverlay} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            fadeAnim.setValue(1);
            setOnboardingVisible(true);
          }}
          style={{padding: 10, marginTop: 40}}>
          <View style={stylesApp.logoContainer}>
            <Image
              source={require('./assets/brand/vaggage.png')}
              style={stylesApp.logo}
              resizeMode="contain"
            />
          </View>
        </Pressable>
      </View>

      {/* Bottom Overlay: Controls */}
      <View style={stylesApp.bottomOverlay} pointerEvents="box-none">
        <Pressable style={langStyles.currentLang} onPress={onChangeLang}>
          <Text style={langStyles.currentLangText}>
            {ttsLang === 'es' ? 'ES - Espanol' : 'EN - English'}
          </Text>
        </Pressable>
        <View style={stylesApp.mainControls} pointerEvents="box-none">
          {state.currentPosition && state.nearestUnplayedLocation && (
            <Pressable
              style={[
                stylesApp.guideButton,
                state.isGuideActive && stylesApp.guideButtonActive,
              ]}
              onPress={actions.toggleGuide}>
              <Text style={stylesApp.guideButtonText}>
                {state.isGuideActive ? 'x Detener guia' : 'Guiame al punto mas cercano'}
              </Text>
            </Pressable>
          )}

          {state.watchId === WATCH_ID_INITIAL ? (
            <Pressable style={stylesApp.startButton} onPress={actions.onStart}>
              <Text style={stylesApp.textStartButton}>Iniciar Recorrido</Text>
            </Pressable>
          ) : (
            <Pressable style={stylesApp.endButton} onPress={actions.onFinish}>
              <Text style={stylesApp.textEndButton}>Detener Ruta</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Onboarding Overlay */}
      {onboardingVisible && (
        <Animated.View
          style={[StyleSheet.absoluteFill, {opacity: fadeAnim, zIndex: 100, backgroundColor: 'white'}]}>
          <Onboarding onFinish={() => {
            onFinishOnboarding();
            setTimeout(() => setOnboardingVisible(false), 1500);
          }} />
        </Animated.View>
      )}
    </View>
  );
}

const langStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13402B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 40,
  },
  buttons: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 130,
  },
  flag: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  langName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  currentLang: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 12,
  },
  currentLangText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1C1C1E',
  },
});

export default App;
