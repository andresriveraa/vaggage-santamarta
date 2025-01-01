import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';


// const GOOGLE_IOS_ID_CLIENT = '24668747507-eb2nhueb0i0v189aqso5oghn0lghabpi.apps.googleusercontent.com';
const GOOGLE_IOS_ID_CLIENT = '24668747507-4n71fb3907cjlsub0lvad8k55l5bn8at.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: GOOGLE_IOS_ID_CLIENT, // Para obtener ID token y acceder a la People API
  offlineAccess: true,        // Para solicitar un token de actualización
  // iosClientId: 'TU_IOS_CLIENT_ID.apps.googleusercontent.com', // si deseas configurarlo explícitamente
  // androidClientId: 'TU_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  forceCodeForRefreshToken: true, // para OAuth2 completo
});


async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();

    // userInfo tendrá la información básica del usuario
    // Podrás acceder a userInfo.user.email, userInfo.user.name, etc.

    // También puedes obtener los tokens:
    const tokens = await GoogleSignin.getTokens();
    // tokens.accessToken, tokens.idToken y refreshToken (si has configurado offlineAccess)

    return {userInfo, tokens};

  } catch (error: any) {
    if (error?.code && error.code === statusCodes.SIGN_IN_CANCELLED) {
      // El usuario canceló el login
      console.log('Login cancelado');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // Operación en progreso
      console.log('Inicio de sesión en progreso');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      // Servicios de Google Play no disponibles o desactualizados
      console.log('Google Play Services no disponible o desactualizado');
    } else {
      // Otro tipo de error
      console.error(error);
    }
    throw error;
  }
}

export default signInWithGoogle;

