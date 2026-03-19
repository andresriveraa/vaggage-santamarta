import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { initialStoryLocations } from '../../data/mock-data-location';
import { GeoPosition } from 'react-native-geolocation-service';

type StoryLocation = (typeof initialStoryLocations)[number];

interface LocationsMapProps {
  currentPosition?: GeoPosition;
  storyLocations?: StoryLocation[];
  targetLocation?: StoryLocation | null;
}

const LocationsMap = ({currentPosition, storyLocations, targetLocation}: LocationsMapProps) => {
  const mapRef = useRef<MapView>(null);
  const hascentered = useRef(false);
  const locations = storyLocations ?? initialStoryLocations;

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
        initialRegion={{
          latitude: locations[0].latitude,
          longitude: locations[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
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
