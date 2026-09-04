import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { GeoPosition } from 'react-native-geolocation-service';
import type { StoryLocation } from '../../services/AirtableService';
import type { CachedAudioGuidePoint } from '../../services/AudioGuideService';
import type { AppLang } from '../../constants/lang';
import colors from '../../constants/colors';

const DETAIL_STRINGS: Record<AppLang, {
  visited: string;
  play: string;
  playing: string;
  download: string;
  downloading: string;
  guideHere: string;
  guidingHere: string;
}> = {
  es: {
    visited: 'Visitado',
    play: 'Reproducir audio',
    playing: 'Reproduciendo…',
    download: 'Descargar audio',
    downloading: 'Descargando…',
    guideHere: 'Guíame aquí',
    guidingHere: 'Guiándote aquí…',
  },
  en: {
    visited: 'Visited',
    play: 'Play audio',
    playing: 'Playing…',
    download: 'Download audio',
    downloading: 'Downloading…',
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
  audioPoints?: CachedAudioGuidePoint[];
  previewingLocationId?: number | null;
  downloadingLocationId?: number | null;
  onPlayPreview?: (location: StoryLocation) => void;
  onStopPreview?: () => void;
  onDownloadPreview?: (location: StoryLocation) => void;
}

const   LocationsMap = ({
  currentPosition,
  storyLocations,
  targetLocation,
  lang,
  onGuideToLocation,
  audioPoints,
  previewingLocationId = null,
  downloadingLocationId = null,
  onPlayPreview,
  onStopPreview,
  onDownloadPreview,
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
  const selectedAudioPoint = selectedLocation
    ? audioPoints?.find(p => p.trackId === selectedLocation.id)
    : undefined;
  const hasAudio = !!selectedAudioPoint?.localPath;
  const isPreviewingSelected =
    selectedLocation !== null && previewingLocationId === selectedLocation.id;
  const isDownloadingSelected =
    selectedLocation !== null && downloadingLocationId === selectedLocation.id;

  const deselectLocation = () => {
    if (previewingLocationId !== null) {
      onStopPreview?.();
    }
    setSelectedLocation(null);
  };

  return (
    <View style={styles.container}>
      <MapView
        showsUserLocation
        ref={mapRef}
        style={styles.map}
        followsUserLocation={false}
        onPress={deselectLocation}
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
              if (previewingLocationId !== null && previewingLocationId !== location.id) {
                onStopPreview?.();
              }
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
              onPress={deselectLocation}>
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

            <Pressable
              style={[
                styles.playButton,
                (!hasAudio || isPreviewingSelected) && styles.playButtonDisabled,
              ]}
              disabled={!hasAudio || isPreviewingSelected}
              onPress={() => selectedLocation && onPlayPreview?.(selectedLocation)}>
              <Text
                style={[
                  styles.playButtonText,
                  (!hasAudio || isPreviewingSelected) && styles.playButtonTextDisabled,
                ]}>
                {isPreviewingSelected ? t.playing : t.play}
              </Text>
            </Pressable>

            {!hasAudio && (
              <Pressable
                style={[
                  styles.downloadButton,
                  isDownloadingSelected && styles.downloadButtonDisabled,
                ]}
                disabled={isDownloadingSelected}
                onPress={() => selectedLocation && onDownloadPreview?.(selectedLocation)}>
                {isDownloadingSelected && (
                  <ActivityIndicator
                    size="small"
                    color={colors.green.textSecondary}
                    style={styles.downloadSpinner}
                  />
                )}
                <Text style={styles.downloadButtonText}>
                  {isDownloadingSelected ? t.downloading : t.download}
                </Text>
              </Pressable>
            )}

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
  downloadButton: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: colors.green.textSecondary,
  },
  downloadButtonDisabled: {
    borderColor: colors.white.secondary,
  },
  downloadSpinner: {
    marginRight: 8,
  },
  downloadButtonText: {
    color: colors.green.textSecondary,
    fontWeight: '600',
    fontSize: 14,
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
