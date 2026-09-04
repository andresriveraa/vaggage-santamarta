import {useCallback, useEffect, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isAppLang, type AppLang} from './constants/lang';
import {useAuth} from './context/AuthContext';
import {Animated} from 'react-native';

const LANG_STORAGE_KEY = '@tts_lang';

const useAppContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const {user, isLoading: isAuthLoading, lang, setLang} = useAuth();

  useEffect(() => {
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

    loadInitialState();
  }, [setLang]);


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

  return {
    isLoading,
    isAuthLoading,
    lang,
    onSelectLang,
    setLang,
    onShowOnboarding,
    onboardingVisible,
    fadeAnim,
    onFinishOnboarding,
    user,
  };
};

export default useAppContent;
