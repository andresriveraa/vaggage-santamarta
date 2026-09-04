import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import colors from '../../constants/colors';
import BackArrowIcon from '../../components/icons/BackArrowIcon';

const COPY = {
  es: {
    title: 'Perfil',
    back: 'Guías',
    signOut: 'Cerrar sesión',
  },
  en: {
    title: 'Profile',
    back: 'Guides',
    signOut: 'Sign out',
  },
};

const ProfileScreen = () => {
  const {signOut, user, lang, toggleLang} = useAuth();
  const navigation = useNavigation();
  const t = COPY[lang];

  const fullName: string | undefined =
    user?.user_metadata?.full_name ?? user?.user_metadata?.name;
  const avatarUrl: string | undefined =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;
  const initial = (fullName ?? user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={[styles.headerButton, styles.headerButtonRow]}
          onPress={() => navigation.goBack()}>
          <BackArrowIcon size={16} color={colors.white.primary} />
          <Text style={styles.headerButtonText}>{t.back}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <Pressable style={styles.headerButton} onPress={() => toggleLang()}>
          <Text style={styles.headerButtonText}>
            {lang === 'es' ? 'EN' : 'ES'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {avatarUrl ? (
          <Image source={{uri: avatarUrl}} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{initial}</Text>
          </View>
        )}
        {fullName ? <Text style={styles.name}>{fullName}</Text> : null}
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Pressable
        style={({pressed}) => [
          styles.signOutButton,
          pressed && styles.signOutButtonPressed,
        ]}
        onPress={signOut}>
        <Text style={styles.signOutText}>{t.signOut}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.green.background,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerButtonText: {
    color: colors.white.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white.primary,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white.primary,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  signOutButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  signOutButtonPressed: {
    backgroundColor: '#D9342A',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white.primary,
  },
});

export default ProfileScreen;
