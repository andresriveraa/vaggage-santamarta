import React, {Text, View} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import { Button } from '@react-navigation/elements';
import { Link } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = () => {
  const {signInWithGoogle} = useAuth();

  return (
    <SafeAreaView>

    <View>
      <Text>hello Login</Text>
      <Button children="Login" onTouchEnd={signInWithGoogle}/>
      <Link screen='GuidesList' params={{}} children="ksjdfj"/>
    </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

