import {StyleSheet, Dimensions, Platform} from 'react-native';
import colors from './src/constants/colors';

const {width, height} = Dimensions.get('window');

export const stylesApp = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.green.background,
  },
  locationMap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    zIndex: 1,
    // Add a subtle gradient or shadow if needed, but keeping it clean for now
  },
  logoContainer: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 8,
  },
  logo: {
    width: 60,
    height: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.green.textSecondary, // Using a visible color if map is light, or check background
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
    // Alternatively, if the map is dark, white is fine. I'll stick to a high contrast approach or white with shadow.
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  startButton: {
    backgroundColor: colors.green.textSecondary,
    width: '100%',
    height: 56,
    borderRadius: 28, // Circular/Pill shape
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  textStartButton: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'uppercase',
  },
  endButton: {
    backgroundColor: '#FF3B30', // Red for stop
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  textEndButton: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'uppercase',
  },
  // Kept for backward compatibility if needed, but unused in new layout
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  status: {
    marginTop: 20,
    fontSize: 18,
    marginBottom: 10,
  },
  dataContainer: {
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subheader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  dataText: {
    fontSize: 14,
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    marginTop: 10,
    color: 'red',
    fontWeight: 'bold',
  },
});
