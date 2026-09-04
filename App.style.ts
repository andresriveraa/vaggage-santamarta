import {StyleSheet, Platform} from 'react-native';
import colors from './src/constants/colors';

export const stylesApp = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  onboardingOverlay: {
    zIndex: 100,
    backgroundColor: 'white',
  },
  logoButton: {
    padding: 10,
    marginTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: colors.green.background,
  },
  locationMap: {
    ...StyleSheet.absoluteFill,
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
  mainControls: {
    width: '100%',
    gap: 10,
  },
  nextStopCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextStopLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.green.textSecondary,
    marginBottom: 2,
  },
  nextStopTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.green.textPrimary,
  },
  nextStopMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  nextStopDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.green.secondary,
  },
  nextStopProgress: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.55)',
  },
  // Tarjeta de descarga: mismo lenguaje visual que nextStopCard, pero es lo
  // primero que ve el usuario al abrir una guía que todavía no bajó.
  downloadMeta: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.55)',
    marginTop: 4,
  },
  downloadError: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  downloadProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginTop: 10,
    overflow: 'hidden',
  },
  downloadProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.green.textSecondary,
  },
  startButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    shadowOpacity: 0,
    elevation: 0,
  },
  guideButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  guideButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  guideButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
  audioControls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    width: '100%',
  },
  audioControlButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  audioStopButton: {
    backgroundColor: '#3A1A1A',
    borderColor: '#FF3B30',
  },
  audioControlText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  langSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  langButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  langButtonActive: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
  langButtonText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1C1C1E',
  },
  langButtonTextActive: {
    color: 'white',
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
