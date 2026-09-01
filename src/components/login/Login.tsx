import React, {useState} from 'react';
import {Alert, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import type {AppLang} from '../../constants/lang';
import {useAuth} from '../../context/AuthContext';
import colors from '../../constants/colors';

const COPY = {
  es: {
    title: 'Inicia sesión para continuar',
    subtitle: 'Necesitas una cuenta de Google para ver las guías disponibles.',
    button: 'Continuar con Google',
    error: 'No se pudo iniciar sesión. Intenta de nuevo.',
  },
  en: {
    title: 'Sign in to continue',
    subtitle: 'You need a Google account to see the available guides.',
    button: 'Continue with Google',
    error: 'Sign-in failed. Please try again.',
  },
};

function Login({lang}: {lang: AppLang}) {
  const {signInWithGoogle} = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const t = COPY[lang];

  const onGoogleButtonPress = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.log('Error en Google Sign-In:', error);
      Alert.alert('Error', t.error);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/brand/vaggage.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.subtitle}>{t.subtitle}</Text>
      <Pressable
        style={styles.googleButton}
        onPress={onGoogleButtonPress}
        disabled={isSigningIn}>
        <Text style={styles.googleButtonText}>{t.button}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.green.background,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 40,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 220,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});

export default Login;
