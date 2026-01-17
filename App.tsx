/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, {useState, useEffect, useRef} from 'react';
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
import useMainHook, {WATCH_ID_INITIAL} from './useMain';
import {stylesApp} from './App.style';
import LocationsMap from './src/components/map/LocationsMap';
import Onboarding from './src/components/onboarding/Onboarding';

function App(): React.JSX.Element {
  const {state, actions} = useMainHook();
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('@onboarding_completed');
      if (value !== 'true') {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.log('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      // Start fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1500, // 1.5 seconds for "waking up" feel
        useNativeDriver: true,
      }).start(() => {
        setShowOnboarding(false);
      });
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={stylesApp.container}>
      {/* Map Layer */}
      <View style={stylesApp.locationMap}>
        <LocationsMap currentPosition={state.currentPosition ?? undefined} />
        {/* <LocationsMap currentPosition={state.currentPosition ?? undefined} /> */}
      </View>

      {/* Top Overlay: Branding */}
      <View style={stylesApp.topOverlay} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            fadeAnim.setValue(1);
            setShowOnboarding(true);
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

      {/* Onboarding Overlay */}
      {showOnboarding && (
        <Animated.View
          style={[StyleSheet.absoluteFill, {opacity: fadeAnim, zIndex: 100, backgroundColor: 'white'}]}>
          <Onboarding onFinish={onFinishOnboarding} />
        </Animated.View>
      )}
    </View>
  );
}

export default App;
