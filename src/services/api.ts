import {Platform} from 'react-native';
import {API_BASE_URL} from '@env';

// La interfaz de loopback del emulador de Android está aislada de la de la
// máquina anfitriona: ahí 127.0.0.1/localhost hay que reescribirlo a 10.0.2.2
// para alcanzar un backend corriendo en el equipo del desarrollador.
export const resolveApiBaseUrl = (): string => {
  if (__DEV__ && Platform.OS === 'android') {
    return API_BASE_URL.replace(/127\.0\.0\.1|localhost/, '10.0.2.2');
  }
  return API_BASE_URL;
};
