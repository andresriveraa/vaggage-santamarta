import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { GeoPosition } from 'react-native-geolocation-service';
import type { StoryLocation } from '../../services/AirtableService';
import type { AppLang } from '../../constants/lang';
import colors from '../../constants/colors';

const DETAIL_STRINGS: Record<AppLang, {
  visited: string;
  // `play`/`playing` quedan a la espera del reproductor de audioguías; hoy
  // ningún control los usa (ver el botón oculto más abajo).
  play: string;
  playing: string;
  guideHere: string;
  guidingHere: string;
}> = {
  es: {
    visited: 'Visitado',
    play: 'Reproducir audio',
    playing: 'Reproduciendo…',
    guideHere: 'Guíame aquí',
    guidingHere: 'Guiándote aquí…',
  },
  en: {
    visited: 'Visited',
    play: 'Play audio',
    playing: 'Playing…',
    guideHere: 'Guide me here',
    guidingHere: 'Guiding you here…',
  },
};

// Centro de La Candelaria, Bogotá — región inicial mientras cargan las ubicaciones
const DEFAULT_REGION = {
  latitude: 4.59819,
  longitude: -74.076,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

interface LocationsMapProps {
  currentPosition?: GeoPosition;
  storyLocations?: StoryLocation[];
  targetLocation?: StoryLocation | null;
  lang: AppLang;
  onGuideToLocation?: (location: StoryLocation) => void;
}

const   LocationsMap = ({
  currentPosition,
  storyLocations,
  targetLocation,
  lang,
  onGuideToLocation,
}: LocationsMapProps) => {
  const mapRef = useRef<MapView>(null);
  const hascentered = useRef(false);
  const locations = storyLocations ?? [];
  const [selectedLocation, setSelectedLocation] = useState<StoryLocation | null>(null);
  const t = DETAIL_STRINGS[lang];

  useEffect(() => {
    if (currentPosition?.coords && mapRef.current && !hascentered.current) {
      hascentered.current = true;
      mapRef.current.animateToRegion({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentPosition]);

  const userCoord = currentPosition
    ? {latitude: currentPosition.coords.latitude, longitude: currentPosition.coords.longitude}
    : null;

  const selectedDescription = selectedLocation
    ? lang === 'en' && selectedLocation.description_en
      ? selectedLocation.description_en
      : selectedLocation.description
    : '';
  const isGuidingHere = selectedLocation !== null && targetLocation?.id === selectedLocation.id;

  return (
    <View style={styles.container}>
      <MapView
        showsUserLocation
        ref={mapRef}
        style={styles.map}
        followsUserLocation={false}
        onPress={() => setSelectedLocation(null)}
        initialRegion={
          locations.length > 0
            ? {
                latitude: locations[0].latitude,
                longitude: locations[0].longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : DEFAULT_REGION
        }
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            onPress={event => {
              event.stopPropagation();
              setSelectedLocation(location);
            }}
            pinColor={
              targetLocation?.id === location.id
                ? 'blue'
                : location.played
                ? 'green'
                : 'red'
            }
          />
        ))}

        {targetLocation && userCoord && (
          <Polyline
            coordinates={[
              userCoord,
              {latitude: targetLocation.latitude, longitude: targetLocation.longitude},
            ]}
            strokeColor="#007AFF"
            strokeWidth={4}
            lineDashPattern={[8, 6]}
          />
        )}
      </MapView>

      {selectedLocation && (
        <View style={styles.detailOverlay} pointerEvents="box-none">
          <View style={styles.detailCard}>
            <Pressable
              style={styles.closeButton}
              hitSlop={10}
              onPress={() => setSelectedLocation(null)}>
              <Text style={styles.closeButtonText}>{'×'}</Text>
            </Pressable>

            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle} numberOfLines={2}>
                {selectedLocation.title}
              </Text>
              {selectedLocation.played && (
                <Text style={styles.visitedBadge}>{t.visited}</Text>
              )}
            </View>

            {selectedDescription !== '' && (
              <ScrollView style={styles.detailScroll}>
                <Text style={styles.detailDescription}>{selectedDescription}</Text>
              </ScrollView>
            )}

            {/* Oculto: aquí iba "Reproducir audio", que sintetizaba la
                descripción con TTS. Vuelve cuando la tarjeta reproduzca el
                archivo de audio descargado de la audioguía. */}

            <Pressable
              style={[styles.guideHereButton, isGuidingHere && styles.guideHereButtonActive]}
              disabled={isGuidingHere}
              onPress={() => {
                onGuideToLocation?.(selectedLocation);
                setSelectedLocation(null);
              }}>
              <Text style={styles.guideHereButtonText}>
                {isGuidingHere ? t.guidingHere : t.guideHere}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5e5e5',
    height: '100%'
  },
  map: {
    width: '100%',
    height: '100%',
  },
  detailOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  detailCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white.primary,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.green.textPrimary,
    marginTop: -1,
  },
  detailHeader: {
    paddingRight: 30,
    marginBottom: 10,
  },
  detailTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.green.textPrimary,
  },
  visitedBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    color: colors.green.secondary,
    backgroundColor: 'rgba(22, 115, 45, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailScroll: {
    maxHeight: 160,
    marginBottom: 16,
  },
  detailDescription: {
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(0,0,0,0.75)',
  },
  playButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonDisabled: {
    backgroundColor: colors.white.secondary,
  },
  playSpinner: {
    marginRight: 8,
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  playButtonTextDisabled: {
    color: 'rgba(0,0,0,0.4)',
  },
  guideHereButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    marginTop: 10,
  },
  guideHereButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  guideHereButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default LocationsMap;
