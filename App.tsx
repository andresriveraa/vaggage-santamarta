/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React from 'react';
import {View, Text, Image, Pressable} from 'react-native';
import useMainHook, {WATCH_ID_INITIAL} from './useMain';
import {stylesApp} from './App.style';

function App(): React.JSX.Element {
  const {state, actions} = useMainHook();

  return (
    <View style={stylesApp.container}>
      <Image
        source={require('./assets/brand/vaggage-negative.png')}
        style={stylesApp.logo}
        resizeMode="contain" // Esto evita que el logo se deforme
        height={120}
        width={120}
      />
      <Text style={stylesApp.header}>Vaggage </Text>
      <Text style={stylesApp.text}>
        Para comenzar nuestro recorrido presiona Comenzar.{' '}
      </Text>

      {state.watchId === WATCH_ID_INITIAL ? (
        <Pressable style={stylesApp.startButton} onPress={actions.onStart}>
          <Text style={stylesApp.textStartButton}>Iniciar Recorrido</Text>
        </Pressable>
      ) : (
        <Pressable style={stylesApp.endButton} onPress={actions.onFinish}>
          <Text style={stylesApp.textEndButton}>Detener Ruta</Text>
        </Pressable>
      )}

      <View style={stylesApp.dataContainer}>
        <Text style={stylesApp.subheader}>Última Posición Registrada:</Text>

        {state.currentPosition ? (
          <>
           <Text>
            {state.appState}
           </Text>
          </>
        ) : (
          <Text style={stylesApp.dataText}>
            Esperando datos de ubicación...
          </Text>
        )}

        {state.error && (
          <Text style={stylesApp.errorText}>⚠️ Error: {state.error}</Text>
        )}
      </View>
    </View>
  );
}

export default App;
