import {getGreatCircleBearing} from 'geolib';
import type {AppLang} from '../constants/lang';

export type Coords = {latitude: number; longitude: number};
export type RelativeDirection = 'front' | 'right' | 'left' | 'back';

// Hitos de distancia (metros) en los que se anuncia el progreso hacia la siguiente parada
export const GUIDANCE_MILESTONES = [500, 300, 200, 100, 50];

// Redondeo hablable: nadie necesita oír "a 187 metros"
export function roundDistance(meters: number): number {
  if (meters >= 100) {
    return Math.round(meters / 50) * 50;
  }
  return Math.max(10, Math.round(meters / 10) * 10);
}

// heading = rumbo de marcha reportado por el GPS (grados desde el norte); -1 o null = inválido.
// Solo es confiable cuando el usuario se está moviendo.
export function relativeDirection(
  user: Coords,
  heading: number | null | undefined,
  target: Coords,
): RelativeDirection | null {
  if (heading == null || heading < 0) {
    return null;
  }
  const bearing = getGreatCircleBearing(user, target);
  const rel = (bearing - heading + 360) % 360;
  if (rel >= 315 || rel < 45) {
    return 'front';
  }
  if (rel < 135) {
    return 'right';
  }
  if (rel < 225) {
    return 'back';
  }
  return 'left';
}

// SIN USO HOY: de aquí para abajo son los textos que se le pasaban al TTS.
// `roundDistance` y `relativeDirection` (arriba) sí se siguen usando. Se
// conservan porque el mismo fraseo sirve para mostrar la indicación en
// pantalla o para la audioguía conversacional.
const DIRECTION_PHRASE: Record<AppLang, Record<RelativeDirection, string>> = {
  es: {
    front: 'Sigue de frente.',
    right: 'Gira a tu derecha.',
    left: 'Gira a tu izquierda.',
    back: 'Está detrás de ti, date la vuelta.',
  },
  en: {
    front: 'Keep going straight.',
    right: 'Turn right.',
    left: 'Turn left.',
    back: "It's behind you, turn around.",
  },
};

function withDirection(base: string, lang: AppLang, direction: RelativeDirection | null): string {
  return direction ? `${base} ${DIRECTION_PHRASE[lang][direction]}` : base;
}

export function nextStopMessage(
  lang: AppLang,
  title: string,
  meters: number,
  direction: RelativeDirection | null,
): string {
  const d = roundDistance(meters);
  const base =
    lang === 'es'
      ? `Siguiente parada: ${title}, a unos ${d} metros.`
      : `Next stop: ${title}, about ${d} meters away.`;
  return withDirection(base, lang, direction);
}

export function milestoneMessage(
  lang: AppLang,
  meters: number,
  direction: RelativeDirection | null,
): string {
  const d = roundDistance(meters);
  const base =
    lang === 'es'
      ? d <= 50
        ? `Ya casi llegas. A unos ${d} metros.`
        : `A unos ${d} metros.`
      : d <= 50
      ? `Almost there. About ${d} meters.`
      : `About ${d} meters to go.`;
  return withDirection(base, lang, direction);
}

export function movingAwayMessage(lang: AppLang, title: string): string {
  return lang === 'es'
    ? `Te estás alejando de ${title}. Da la vuelta cuando puedas.`
    : `You're moving away from ${title}. Turn back when you can.`;
}

export function arrivalMessage(lang: AppLang, title: string): string {
  return lang === 'es' ? `Llegaste a ${title}.` : `You've arrived at ${title}.`;
}

export function tourCompleteMessage(lang: AppLang): string {
  return lang === 'es'
    ? 'Recorrido completado. Gracias por caminar con Vaggage.'
    : 'Tour complete. Thanks for walking with Vaggage.';
}
