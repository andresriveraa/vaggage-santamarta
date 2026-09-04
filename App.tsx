import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {AuthProvider} from './src/context/AuthContext';
import {CitiesProvider} from './src/context/CitiesContext';
import AppContent from './src/AppContent';


const App = () =>(
  <GestureHandlerRootView>
    <AuthProvider>
      <CitiesProvider>
        <AppContent />
      </CitiesProvider>
    </AuthProvider>
  </GestureHandlerRootView>
);

export default App;
