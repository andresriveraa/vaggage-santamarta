import {GoogleSigninButton} from '@react-native-google-signin/google-signin';
import React from 'react';
import signInWithGoogle from './utils';
import { View } from 'react-native';

const Login = () => {
  const onGoogleButtonPress = async () => {
    try {
      const userInfo = await signInWithGoogle();
      // Maneja el objeto userInfo según tu lógica
      // Por ejemplo, guardar en Redux, Context o enviarlo a tu backend
      console.log(JSON.stringify(userInfo));
    } catch (error) {
      console.log('Error en Google Sign-In:', error);
    }
  };
  return (
    <View>
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={onGoogleButtonPress}
        // disabled={isInProgress}
      />

    </View>
  );
};

export default Login;
