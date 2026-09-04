import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import useMainHook from '../../../useMain';
import type {AppLang} from '../../constants/lang';
import {roundDistance} from '../../services/guidance';
import {stylesApp} from '../../../App.style';
import LocationsMap from '../map/LocationsMap';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { ArrowLeft } from 'lucide-react-native';
// Referencia estable: pasar `[]` inline en cada render cambiaría de
// identidad y dispararía de nuevo el efecto que arma las paradas.

const COPY: Record<
  AppLang,
  {
    nextStop: string;
    headingTo: string;
    stopsOf: (played: number, total: number) => string;
    metersAway: (m: number) => string;
    tourComplete: string;
    guideOn: string;
    guideOff: string;
    startTour: string;
    endTour: string;
    downloadTitle: string;
    downloadMeta: (stops: number) => string;
    downloadAction: string;
    downloadRetry: string;
    downloadingMeta: (done: number, total: number) => string;
    downloadError: string;
    audioMissing: (withAudio: number, total: number) => string;
    playing: string;
  }
> = {
  es: {
    nextStop: 'Siguiente parada',
    headingTo: 'Volviendo a',
    stopsOf: (played, total) => `${played} de ${total} paradas`,
    metersAway: m => `a unos ${m} m`,
    tourComplete: 'Recorrido completado',
    guideOn: 'Dejar de guiarme',
    guideOff: 'Guiarme a la parada',
    startTour: 'Iniciar recorrido',
    endTour: 'Terminar recorrido',
    downloadTitle: 'Descarga la guía',
    downloadMeta: stops =>
      `${stops} paradas. Se descargan una vez y quedan en tu teléfono.`,
    downloadAction: 'Descargar guía',
    downloadRetry: 'Reintentar descarga',
    downloadingMeta: (done, total) => `Descargando ${done} de ${total} paradas`,
    downloadError: 'No pudimos descargar la guía. Revisa tu conexión.',
    audioMissing: (withAudio, total) =>
      `${withAudio} de ${total} paradas tienen audio`,
    playing: 'Reproduciendo…',
  },
  en: {
    nextStop: 'Next stop',
    headingTo: 'Heading to',
    stopsOf: (played, total) => `${played} of ${total} stops`,
    metersAway: m => `about ${m} m away`,
    tourComplete: 'Tour complete',
    guideOn: 'Stop guiding me',
    guideOff: 'Guide me to the stop',
    startTour: 'Start tour',
    endTour: 'End tour',
    downloadTitle: 'Download the guide',
    downloadMeta: stops =>
      `${stops} stops. Downloaded once, then stored on your phone.`,
    downloadAction: 'Download guide',
    downloadRetry: 'Retry download',
    downloadingMeta: (done, total) => `Downloading ${done} of ${total} stops`,
    downloadError: "We couldn't download the guide. Check your connection.",
    audioMissing: (withAudio, total) =>
      `${withAudio} of ${total} stops have audio`,
    playing: 'Playing…',
  },
};


function GuideDetail() {
  const {state, actions} = useMainHook();
  const t = COPY[state.lang];

  return (
    <SafeAreaView style={stylesApp.flex1} edges={[]}>
      <View style={stylesApp.locationMap}>
        <LocationsMap
          currentPosition={state.currentPosition ?? undefined}
          storyLocations={state.storyLocations}
          targetLocation={state.isGuideActive ? state.guidanceTarget : null}
          lang={state.lang}
          onGuideToLocation={actions.guideToLocation}
        />
      </View>

      <Pressable style={styles.backButton} onPress={actions.onBack}>
        {/* <Text style={styles.backButtonText}>{'<'}</Text> */}
      </Pressable>
      <View style={styles.overlaysLayer}>
        {/* Top Overlay: Back + Branding */}
        <View style={stylesApp.topOverlay} pointerEvents="box-none">
          {state.guide && (
            <View style={styles.guideBadge}>
              <Text style={styles.guideBadgeTitle} numberOfLines={1}>
                {state.guide.name}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Overlay: Controls */}
        <View style={stylesApp.bottomOverlay} pointerEvents="box-none">
          {/* Tarjeta de progreso: qué sigue y cuánto falta, legible de un vistazo */}
          {state.isTourActive && state.guidanceTarget && (
            <View style={stylesApp.nextStopCard}>
              <Text style={stylesApp.nextStopLabel}>
                {state.guidanceTarget.played ? t.headingTo : t.nextStop}
              </Text>
              <Text style={stylesApp.nextStopTitle} numberOfLines={1}>
                {state.guidanceTarget.title}
              </Text>
              <View style={stylesApp.nextStopMetaRow}>
                {state.isAudioBusy ? (
                  <Text style={stylesApp.nextStopDistance}>{t.playing}</Text>
                ) : (
                  state.distanceToTarget !== null && (
                    <Text style={stylesApp.nextStopDistance}>
                      {t.metersAway(roundDistance(state.distanceToTarget))}
                    </Text>
                  )
                )}
                <Text style={stylesApp.nextStopProgress}>
                  {t.stopsOf(state.playedCount, state.totalCount)}
                </Text>
              </View>
            </View>
          )}

          {!state.isTourActive && !state.isAudioReady && (
            <View style={stylesApp.nextStopCard}>
              <Text style={stylesApp.nextStopLabel}>{t.downloadTitle}</Text>
              <Text style={stylesApp.nextStopTitle} numberOfLines={2}>
                {state.isDownloading
                  ? t.downloadingMeta(state.completed, state.total)
                  : t.downloadMeta(state.totalCount)}
              </Text>
              {state.audioStatus === 'error' && (
                <Text style={stylesApp.downloadError}>{t.downloadError}</Text>
              )}
              {state.isDownloading && state.total > 0 && (
                <View style={stylesApp.downloadProgressTrack}>
                  <View
                    style={[
                      stylesApp.downloadProgressFill,
                      {
                        width: `${Math.round(
                          (state.completed / state.total) * 100,
                        )}%`,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          )}

          {/* Una guía puede quedar lista con paradas sin audio: el bucket todavía
            no tiene ese archivo. Se avisa, pero no bloquea el recorrido. */}
          {!state.isTourActive &&
            state.isAudioReady &&
            state.audioReadyCount < state.totalCount && (
              <View style={stylesApp.nextStopCard}>
                <Text style={stylesApp.nextStopProgress}>
                  {t.audioMissing(state.audioReadyCount, state.totalCount)}
                </Text>
              </View>
            )}

          {state.isTourActive &&
            !state.guidanceTarget &&
            state.isTourComplete && (
              <View style={stylesApp.nextStopCard}>
                <Text style={stylesApp.nextStopTitle}>{t.tourComplete}</Text>
                <Text style={stylesApp.nextStopProgress}>
                  {t.stopsOf(state.playedCount, state.totalCount)}
                </Text>
              </View>
            )}

          <View style={stylesApp.mainControls} pointerEvents="box-none">
            {state.isTourActive && !state.isTourComplete && (
              <Pressable
                style={[
                  stylesApp.guideButton,
                  state.isGuideActive && stylesApp.guideButtonActive,
                ]}
                onPress={actions.toggleGuide}>
                <Text style={stylesApp.guideButtonText}>
                  {state.isGuideActive ? t.guideOn : t.guideOff}
                </Text>
              </Pressable>
            )}

            {!state.isTourActive && !state.isAudioReady ? (
              <Pressable
                style={[
                  stylesApp.startButton,
                  state.isDownloading && stylesApp.startButtonDisabled,
                ]}
                disabled={state.isDownloading}
                onPress={actions.downloadGuideAudio}>
                {state.isDownloading && (
                  <ActivityIndicator size="small" color="white" />
                )}
                {!state.isDownloading && (
                  <Text style={stylesApp.textStartButton}>
                    {state.audioStatus === 'error'
                      ? t.downloadRetry
                      : t.downloadAction}
                  </Text>
                )}
              </Pressable>
            ) : !state.isTourActive ? (
              <Pressable
                style={stylesApp.startButton}
                onPress={actions.onStart}>
                <Text style={stylesApp.textStartButton}>{t.startTour}</Text>
              </Pressable>
            ) : (
              <Pressable style={stylesApp.endButton} onPress={actions.onFinish}>
                <Text style={stylesApp.textEndButton}>{t.endTour}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // A diferencia de stylesApp.container, esta capa solo posiciona los
  // overlays absolutos (top/bottom) sobre el mapa: no debe pintar fondo,
  // o taparía el mapa que queda detrás.
  overlaysLayer: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 56,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  backButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13402B',
    marginTop: -2,
  },
  guideBadge: {
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    maxWidth: 220,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  guideBadgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#13402B',
  },
  guideBadgeCity: {
    fontSize: 11,
    color: '#6B7280',
  },
});

export default GuideDetail;
