import React from 'react';
import {
  ActivityIndicator,
  View,
  Text,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {stylesApp} from '../App.style';
import GuideList from './components/guides/GuideList';
import LanguagePicker from './components/language/LanguagePicker';
import GuideDetail from './components/tour/MainApp';
import useAppContent from './useAppContente';
import {useAuth} from './context/AuthContext';
import {Button } from '@react-navigation/elements';
import LoginScreen from './features/login/LoginScreen';
import { CityGuides } from './services/PurchasesService';


export type RootStackParamList = {
  MapGuide: {guide?: CityGuides};
  LngSelect: undefined;
  Onboarding: undefined;
  Login: undefined;
  GuidesList: undefined;
  Profile?: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const ProfileScreen = () => {
  const {signOut, user} = useAuth();
  return (
    <SafeAreaView>
      <View>
        <Text>hello profile</Text>
        <Text>{user?.email}</Text>
        <Button onTouchEnd={signOut}>logout</Button>
        <Button screen={'GuidesList'} params={{}}>
          profile
        </Button>
      </View>
    </SafeAreaView>
  );
};

const OnboardingScreen = () => (
  <View>
    <Text>hello onboarding</Text>
  </View>
);

function AuthStack() {
  const {lang} = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={lang ? 'Login' : 'LngSelect'}
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="LngSelect" component={LanguagePicker} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="GuidesList" component={GuideList} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="MapGuide"
        component={GuideDetail}
        options={{presentation: 'card'}}
      />
    </Stack.Navigator>
  );
}

function AppContent(): React.JSX.Element {
  const logic = useAppContent();

  if (logic.isLoading || logic.isAuthLoading) {
    return (
      <View style={stylesApp.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={stylesApp.flex1}>
        <NavigationContainer>
          {logic.user ? <MainStack /> : <AuthStack />}
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

export default AppContent;
