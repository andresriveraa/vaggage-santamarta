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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import useMainHook, {WATCH_ID_INITIAL} from './useMain';
import {isAppLang, type AppLang} from './src/constants/lang';
import {roundDistance} from './src/services/guidance';
import {stylesApp} from './App.style';
import LocationsMap from './src/components/map/LocationsMap';
import Onboarding from './src/components/onboarding/Onboarding';
import GuideList from './src/components/guides/GuideList';
import Login from './src/components/login/Login';

export type RootStackParamList = {
  Guides: undefined;
  Map: {guideId: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// La clave conserva el nombre de cuando el idioma solo elegía la voz del TTS:
// renombrarla haría que las instalaciones existentes volvieran a preguntar.
const LANG_STORAGE_KEY = '@tts_lang';

function LanguagePicker({onSelect}: {onSelect: (lang: AppLang) => void}) {
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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [lang, setLang] = useState<AppLang | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const {user, isLoading: isAuthLoading} = useAuth();

  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    try {
      const [onboarding, savedLang] = await Promise.all([
        AsyncStorage.getItem('@onboarding_completed'),
        AsyncStorage.getItem(LANG_STORAGE_KEY),
      ]);
      if (onboarding !== 'true') {
        setOnboardingVisible(true);
      }
      if (isAppLang(savedLang)) {
        setLang(savedLang);
      }
    } catch (error) {
      console.log('Error loading initial state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectLang = async (selected: AppLang) => {
    setLang(selected);
    try {
      await AsyncStorage.setItem(LANG_STORAGE_KEY, selected);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const onShowOnboarding = useCallback(() => {
    fadeAnim.setValue(1);
    setOnboardingVisible(true);
  }, [fadeAnim]);

  const onFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      setOnboardingVisible(false);
    });
  };

  if (isLoading || isAuthLoading) {
    return (
      <View style={stylesApp.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (lang === null) {
    return <LanguagePicker onSelect={onSelectLang} />;
  }

  return (
    <SafeAreaProvider>
      <View style={stylesApp.flex1}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name="Guides">
              {({navigation}) => (
                <GuideList
                  lang={lang}
                  onSelectGuide={guideId =>
                    navigation.navigate('Map', {guideId})
                  }
                  onChangeLang={() => setLang(null)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Map">
              {({navigation, route}) => (
                <MainApp
                  lang={lang}
                  guideId={route.params.guideId}
                  onBack={() => navigation.goBack()}
                  onShowOnboarding={onShowOnboarding}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>

        {/* Onboarding Overlay */}
        {onboardingVisible && (
          <Animated.View
            style={[StyleSheet.absoluteFill, stylesApp.onboardingOverlay, {opacity: fadeAnim}]}>
            <Onboarding onFinish={onFinishOnboarding} />
          </Animated.View>
        )}

        {/* Login gate: shown after onboarding on first run, or immediately on
            return visits when there is no active Supabase session, blocking the
            Guides list underneath until sign-in succeeds. */}
        {!onboardingVisible && user === null && (
          <View style={StyleSheet.absoluteFill}>
            <Login lang={lang} />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const UI_STRINGS: Record<AppLang, {
  nextStop: string;
  headingTo: string;
  stopsOf: (played: number, total: number) => string;
  metersAway: (m: number) => string;
  tourComplete: string;
  guideOn: string;
  guideOff: string;
  startTour: string;
  endTour: string;
  downloadTitle: string;
  downloadMeta: (stops: number) => string;
  downloadAction: string;
  downloadRetry: string;
  downloadingMeta: (done: number, total: number) => string;
  downloadError: string;
  audioMissing: (withAudio: number, total: number) => string;
  playing: string;
}> = {
  es: {
    nextStop: 'Siguiente parada',
    headingTo: 'Volviendo a',
    stopsOf: (played, total) => `${played} de ${total} paradas`,
    metersAway: m => `a unos ${m} m`,
    tourComplete: 'Recorrido completado',
    guideOn: 'Dejar de guiarme',
    guideOff: 'Guiarme a la parada',
    startTour: 'Iniciar recorrido',
    endTour: 'Terminar recorrido',
    downloadTitle: 'Descarga la guía',
    downloadMeta: stops =>
      `${stops} paradas. Se descargan una vez y quedan en tu teléfono.`,
    downloadAction: 'Descargar guía',
    downloadRetry: 'Reintentar descarga',
    downloadingMeta: (done, total) => `Descargando ${done} de ${total} paradas`,
    downloadError: 'No pudimos descargar la guía. Revisa tu conexión.',
    audioMissing: (withAudio, total) =>
      `${withAudio} de ${total} paradas tienen audio`,
    playing: 'Reproduciendo…',
  },
  en: {
    nextStop: 'Next stop',
    headingTo: 'Heading to',
    stopsOf: (played, total) => `${played} of ${total} stops`,
    metersAway: m => `about ${m} m away`,
    tourComplete: 'Tour complete',
    guideOn: 'Stop guiding me',
    guideOff: 'Guide me to the stop',
    startTour: 'Start tour',
    endTour: 'End tour',
    downloadTitle: 'Download the guide',
    downloadMeta: stops =>
      `${stops} stops. Downloaded once, then stored on your phone.`,
    downloadAction: 'Download guide',
    downloadRetry: 'Retry download',
    downloadingMeta: (done, total) => `Downloading ${done} of ${total} stops`,
    downloadError: "We couldn't download the guide. Check your connection.",
    audioMissing: (withAudio, total) => `${withAudio} of ${total} stops have audio`,
    playing: 'Playing…',
  },
};

function MainApp({lang, guideId, onBack, onShowOnboarding}: {
  lang: AppLang;
  guideId: string;
  onBack: () => void;
  onShowOnboarding: () => void;
}) {
  const {user} = useAuth();
  const {state, actions} = useMainHook(lang, guideId, user?.id ?? null);
  const t = UI_STRINGS[lang];

  const isTourActive = state.watchId !== WATCH_ID_INITIAL;
  const isTourComplete =
    state.totalCount > 0 && state.playedCount === state.totalCount;

  // El recorrido no arranca hasta tener el audio en disco: salir a caminar con
  // una guía a medio bajar es justo lo que la descarga previa evita.
  const isAudioReady = state.audioStatus === 'ready';
  const isDownloading = state.audioStatus === 'downloading';
  const {completed, total} = state.audioProgress;

  return (
    <View style={stylesApp.container}>
      {/* Map Layer */}
      <View style={stylesApp.locationMap}>
        <LocationsMap
          currentPosition={state.currentPosition ?? undefined}
          storyLocations={state.storyLocations}
          targetLocation={state.isGuideActive ? state.guidanceTarget : null}
          lang={lang}
          onGuideToLocation={actions.guideToLocation}
        />
      </View>

      {/* Top Overlay: Back + Branding */}
      <View style={stylesApp.topOverlay} pointerEvents="box-none">
        <Pressable style={langStyles.backButton} onPress={onBack}>
          <Text style={langStyles.backButtonText}>{'k'}</Text>
        </Pressable>
        <Pressable
          onPress={onShowOnboarding}
          style={stylesApp.logoButton}>
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
        {/* Tarjeta de progreso: qué sigue y cuánto falta, legible de un vistazo */}
        {isTourActive && state.guidanceTarget && (
          <View style={stylesApp.nextStopCard}>
            <Text style={stylesApp.nextStopLabel}>
              {state.guidanceTarget.played ? t.headingTo : t.nextStop}
            </Text>
            <Text style={stylesApp.nextStopTitle} numberOfLines={1}>
              {state.guidanceTarget.title}
            </Text>
            <View style={stylesApp.nextStopMetaRow}>
              {state.isAudioBusy ? (
                <Text style={stylesApp.nextStopDistance}>{t.playing}</Text>
              ) : (
                state.distanceToTarget !== null && (
                  <Text style={stylesApp.nextStopDistance}>
                    {t.metersAway(roundDistance(state.distanceToTarget))}
                  </Text>
                )
              )}
              <Text style={stylesApp.nextStopProgress}>
                {t.stopsOf(state.playedCount, state.totalCount)}
              </Text>
            </View>
          </View>
        )}
        {!isTourActive && !isAudioReady && (
          <View style={stylesApp.nextStopCard}>
            <Text style={stylesApp.nextStopLabel}>{t.downloadTitle}</Text>
            <Text style={stylesApp.nextStopTitle} numberOfLines={2}>
              {isDownloading
                ? t.downloadingMeta(completed, total)
                : t.downloadMeta(state.totalCount)}
            </Text>
            {state.audioStatus === 'error' && (
              <Text style={stylesApp.downloadError}>{t.downloadError}</Text>
            )}
            {isDownloading && total > 0 && (
              <View style={stylesApp.downloadProgressTrack}>
                <View
                  style={[
                    stylesApp.downloadProgressFill,
                    {width: `${Math.round((completed / total) * 100)}%`},
                  ]}
                />
              </View>
            )}
          </View>
        )}

        {/* Una guía puede quedar lista con paradas sin audio: el bucket todavía
            no tiene ese archivo. Se avisa, pero no bloquea el recorrido. */}
        {!isTourActive &&
          isAudioReady &&
          state.audioReadyCount < state.totalCount && (
            <View style={stylesApp.nextStopCard}>
              <Text style={stylesApp.nextStopProgress}>
                {t.audioMissing(state.audioReadyCount, state.totalCount)}
              </Text>
            </View>
          )}

        {isTourActive && !state.guidanceTarget && isTourComplete && (
          <View style={stylesApp.nextStopCard}>
            <Text style={stylesApp.nextStopTitle}>{t.tourComplete}</Text>
            <Text style={stylesApp.nextStopProgress}>
              {t.stopsOf(state.playedCount, state.totalCount)}
            </Text>
          </View>
        )}

        <View style={stylesApp.mainControls} pointerEvents="box-none">
          {isTourActive && !isTourComplete && (
            <Pressable
              style={[
                stylesApp.guideButton,
                state.isGuideActive && stylesApp.guideButtonActive,
              ]}
              onPress={actions.toggleGuide}>
              <Text style={stylesApp.guideButtonText}>
                {state.isGuideActive ? t.guideOn : t.guideOff}
              </Text>
            </Pressable>
          )}

          {!isTourActive && !isAudioReady ? (
            <Pressable
              style={[stylesApp.startButton, isDownloading && stylesApp.startButtonDisabled]}
              disabled={isDownloading}
              onPress={actions.downloadGuideAudio}>
              {isDownloading && (
                <ActivityIndicator size="small" color="white" />
              )}
              {!isDownloading && (
                <Text style={stylesApp.textStartButton}>
                  {state.audioStatus === 'error' ? t.downloadRetry : t.downloadAction}
                </Text>
              )}
            </Pressable>
          ) : !isTourActive ? (
            <Pressable style={stylesApp.startButton} onPress={actions.onStart}>
              <Text style={stylesApp.textStartButton}>{t.startTour}</Text>
            </Pressable>
          ) : (
            <Pressable style={stylesApp.endButton} onPress={actions.onFinish}>
              <Text style={stylesApp.textEndButton}>{t.endTour}</Text>
            </Pressable>
          )}
        </View>
      </View>
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
  backButton: {
    position: 'absolute',
    left: 16,
    top: 56,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  backButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13402B',
    marginTop: -2,
  },
});

export default App;
