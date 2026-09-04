import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import colors from '../../constants/colors';

const COPY = {
  es: {
    title: 'Inicia sesión para continuar',
    subtitle: 'Necesitas una cuenta de Google para ver las guías disponibles.',
    button: 'Continuar con Google',
    error: 'No se pudo iniciar sesión. Intenta de nuevo.',
    disclaimer: 'Al continuar aceptas nuestros términos y política de privacidad.',
  },
  en: {
    title: 'Sign in to continue',
    subtitle: 'You need a Google account to see the available guides.',
    button: 'Continue with Google',
    error: 'Sign-in failed. Please try again.',
    disclaimer: 'By continuing you agree to our terms and privacy policy.',
  },
};

function Login() {
  const {lang, signInWithGoogle} = useAuth();
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
      <View style={styles.content}>
        <Image
          source={require('../../../assets/brand/kuascua-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({pressed}) => [
            styles.googleButton,
            pressed && styles.googleButtonPressed,
          ]}
          onPress={onGoogleButtonPress}
          disabled={isSigningIn}>
          {isSigningIn ? (
            <ActivityIndicator size="small" color={colors.green.background} />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>{t.button}</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.disclaimer}>{t.disclaimer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.green.background,
    justifyContent: 'space-between',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 100,
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  footer: {
    alignItems: 'center',
    gap: 14,
  },
  googleButton: {
    flexDirection: 'row',
    width: '100%',
    height: 56,
    backgroundColor: colors.white.primary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  googleButtonPressed: {
    backgroundColor: colors.white.secondary,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default Login;
