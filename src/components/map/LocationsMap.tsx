import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps'; // 1. Quita PROVIDER_GOOGLE de aquí
import { initialStoryLocations } from '../../data/mock-data-location';
import { GeoPosition } from 'react-native-geolocation-service';

// const { width, height } = Dimensions.get('window');

const LocationsMap = ({currentPosition}: {currentPosition?: GeoPosition}) => {
  const mapRef = useRef<MapView>(null); // 1. Crear referencia

  // 2. Efecto para mover el mapa cuando cambia la ubicación
  useEffect(() => {
    if (currentPosition?.coords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000); // 1000ms de animación
    }
  }, [currentPosition]); // Se ejecuta cada vez que currentPosition cambia
  return (
    <View style={styles.container}>
      <MapView
        showsUserLocation
        ref={mapRef}
        style={styles.map}
        followsUserLocation={true}
        initialRegion={{
          latitude: initialStoryLocations[0].latitude,
          longitude: initialStoryLocations[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {initialStoryLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.title}
            description="Toca para más detalles"
            pinColor={location.played ? 'green' : 'red'}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Esto hace que ocupe todo el espacio del padre
    backgroundColor: '#e5e5e5', // Color de fondo por si el mapa falla
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
  debugText: {
    color: 'white',
  },
});

export default LocationsMap;
