import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { GeoPosition } from 'react-native-geolocation-service';
import type { StoryLocation } from '../../services/AirtableService';

// Centro de La Candelaria, Bogotá — región inicial mientras cargan las ubicaciones
const DEFAULT_REGION = {
  latitude: 4.6014,
  longitude: -74.0661,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

interface LocationsMapProps {
  currentPosition?: GeoPosition;
  storyLocations?: StoryLocation[];
  targetLocation?: StoryLocation | null;
}

const LocationsMap = ({currentPosition, storyLocations, targetLocation}: LocationsMapProps) => {
  const mapRef = useRef<MapView>(null);
  const hascentered = useRef(false);
  const locations = storyLocations ?? [];

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

  return (
    <View style={styles.container}>
      <MapView
        showsUserLocation
        ref={mapRef}
        style={styles.map}
        followsUserLocation={false}
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
            title={location.title}
            description="Toca para más detalles"
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5e5e5',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default LocationsMap;
