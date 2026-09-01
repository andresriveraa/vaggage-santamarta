import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {fetchGuides, type Guide} from '../../services/AirtableService';
import {fetchPurchasedCities} from '../../services/PurchasesService';
import {useAuth} from '../../context/AuthContext';
import type {AppLang} from '../../constants/lang';
import colors from '../../constants/colors';

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

function GuideCard({
  guide,
  pointsLabel,
  onPress,
}: {
  guide: Guide;
  pointsLabel: string;
  onPress: () => void;
}) {
  const place = [guide.city, guide.country].filter(Boolean).join(', ');

  return (
    <Pressable
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{guide.name || guide.id}</Text>
        {place !== '' && <Text style={styles.cardPlace}>{place}</Text>}
        <Text style={styles.cardMeta}>
          {[guide.duration, `${guide.pointsCount} ${pointsLabel}`]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <View style={styles.tagsWrapper}>
          {guide.tags.map((tag, index) => (
            // Es mejor usar el string del tag como key si es único, o combinarlo con el index
            <View key={`tag-${index}`} style={styles.tagContainer}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      {guide.price !== '' && (
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{guide.price}</Text>
        </View>
      )}
    </Pressable>
  );
}

function GuideList({
  lang,
  onSelectGuide,
  onChangeLang,
}: {
  lang: AppLang;
  onSelectGuide: (guideId: string) => void;
  onChangeLang: () => void;
}) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const {user} = useAuth();
  const copy = COPY[lang];

  const loadGuides = useCallback(() => {
    if (!user) {
      return;
    }
    setIsLoading(true);
    setHasError(false);
    Promise.all([fetchGuides(), fetchPurchasedCities(user.id)])
      .then(([allGuides, purchases]) => {
        const purchasedCityIds = new Set(
          purchases
            .filter(purchase => purchase.status === 'completed')
            .map(purchase => purchase.cityId),
        );
        setGuides(allGuides.filter(guide => purchasedCityIds.has(guide.cityId)));
      })
      .catch(err => {
        console.warn('[GuideList] Error al cargar guías:', err);
        setHasError(true);
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => {
    loadGuides();
  }, [loadGuides]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../../assets/brand/vaggage.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Pressable style={styles.langButton} onPress={onChangeLang}>
          <Text style={styles.langButtonText}>
            {lang === 'es' ? 'ES' : 'EN'}
          </Text>
        </Pressable>
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
          <Pressable style={styles.retryButton} onPress={loadGuides}>
            <Text style={styles.retryText}>{copy.retry}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={guides}
          keyExtractor={guide => guide.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={styles.emptyText}>{copy.empty}</Text>
            </View>
          }
          renderItem={({item}) => (
            <GuideCard
              guide={item}
              pointsLabel={copy.points}
              onPress={() => onSelectGuide(item.id)}
            />
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
    gap: 14,
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
  card: {
    backgroundColor: colors.white.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{scale: 0.98}],
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.green.textPrimary,
  },
  cardPlace: {
    fontSize: 14,
    color: colors.green.textSecondary,
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceBadge: {
    backgroundColor: colors.green.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 12,
  },
  priceText: {
    color: colors.white.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
    tagsWrapper: {
    flexDirection: 'row', // Los coloca uno al lado del otro
    flexWrap: 'wrap',     // Si no caben en una línea, bajan a la siguiente
    gap: 8,               // Espaciado entre tags (funciona en versiones recientes de RN)
    marginTop: 8,         // Separación del texto de arriba ("10 puntos")
  },
  // Contenedor individual de cada tag (Opción 2 de la respuesta anterior)
  tagContainer: {
    backgroundColor: '#F0F2F5',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    // marginBottom: 8, // Descomenta esto si tu versión de RN no soporta 'gap' en tagsWrapper
    // marginRight: 8,  // Descomenta esto si tu versión de RN no soporta 'gap' en tagsWrapper
  },
  // El texto por dentro
  tagText: {
    color: '#4A5568', // Un gris oscuro para buen contraste
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GuideList;
