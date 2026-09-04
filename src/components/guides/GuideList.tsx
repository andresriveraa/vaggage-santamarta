import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useCities} from '../../context/CitiesContext';
import colors from '../../constants/colors';
import {useAuth} from '../../context/AuthContext';
import {Link} from '@react-navigation/native';
import GuideCard from '../GuideCard/GuideCard';

const COPY = {
  es: {
    title: 'Guías disponibles',
    subtitle: 'Elige una guía para comenzar tu recorrido',
    empty: 'No hay guías disponibles por ahora.',
    error: 'No se pudieron cargar las guías.',
    retry: 'Reintentar',
    points: 'puntos',
  },
  en: {
    title: 'Available guides',
    subtitle: 'Choose a guide to start your tour',
    empty: 'No guides available right now.',
    error: 'Guides could not be loaded.',
    retry: 'Retry',
    points: 'stops',
  },
};

function GuideList() {
  const auth = useAuth();

  const {cities, isLoading, hasError, reload} = useCities();
  const copy = COPY[auth.lang];

  const sections = cities
    .filter(city => city.guides.length > 0)
    .map(city => ({
      title: city.name,
      key: city.id,
      data: city.guides,
    }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../../assets/brand/vaggage.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Pressable style={styles.langButton} onPress={() => auth.toggleLang()}>
          <Text style={styles.langButtonText}>
            {auth.lang === 'es' ? 'EN' : 'ES'}
          </Text>
        </Pressable>
        <Link style={styles.langButton} screen={'Profile'} params={{}}>
          <Text style={styles.langButtonText}>profile</Text>
        </Link>
      </View>

      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.white.primary} />
        </View>
      ) : hasError ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{copy.error}</Text>
          <Pressable style={styles.retryButton} onPress={reload}>
            <Text style={styles.retryText}>{copy.retry}</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={guide => guide.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={styles.emptyText}>{copy.empty}</Text>
            </View>
          }
          renderSectionHeader={({section}) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({item}) => (
            <GuideCard guide={item} pointsLabel={copy.points} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.green.background,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  logo: {
    width: 56,
    height: 56,
  },
  langButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  langButtonText: {
    color: colors.white.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.white.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: 16,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retryText: {
    color: colors.white.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});

export default GuideList;
