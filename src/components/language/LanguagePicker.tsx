import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import { useAuth } from '../../context/AuthContext';

function LanguagePicker() {
  const {setLang} = useAuth();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/brand/kuascua-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Selecciona tu idioma</Text>
      <Text style={styles.subtitle}>Choose your language</Text>
      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={() => setLang('es')}>
          <Text style={styles.flag}>ES</Text>
          <Text style={styles.langName}>Espanol</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => setLang('en')}>
          <Text style={styles.flag}>EN</Text>
          <Text style={styles.langName}>English</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13402B',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 40,
  },
  buttons: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 130,
  },
  flag: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  langName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
});

export default LanguagePicker;
