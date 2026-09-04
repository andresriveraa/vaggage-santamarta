# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vaggage is a React Native (0.86.3, RN CLI, not Expo) mobile app that delivers offline, GPS-triggered audio walking tours. A user picks a language and a guide, walks a route, and the app narrates locations via on-device TTS as they get physically close to each stop.

## Commands

```bash
# Install JS deps
npm install

# iOS native deps (run after npm install or when native deps change)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on a simulator/device
npm run ios
npm run android

# Lint
npm run lint

# Type-check (no dedicated script; run directly)
npx tsc --noEmit

# Tests (Jest + react-test-renderer)
npm test
npm test -- --watch
npx jest __tests__/App.test.tsx   # single file
npx jest -t "renders correctly"   # single test by name
```

There is only one test file (`__tests__/App.test.tsx`), a smoke render of `App`.

### Environment variables

Build-time config is injected via `react-native-dotenv` (`babel.config.js` plugin) from a git-ignored `.env` file at the repo root, typed in `src/types/env.d.ts` and imported as `import {X} from '@env'`. Required keys: `AIRTABLE_ACCESS_TOKEN`, `GOOGLE_IOS_ID_CLIENT`, `GOOGLE_IOS_URL_SCHEMA`. Changes to `.env` require a Metro restart (cache reset: `npm start -- --reset-cache`).

## Architecture

### Screen flow (`App.tsx`)

`App.tsx` is the root component and owns three sequential gates before showing any navigable screen, backed by `AsyncStorage`:
1. `isLoading` — reading persisted state.
2. Language gate — if no `@tts_lang` is saved, renders `LanguagePicker` (inline in `App.tsx`) instead of the navigator. Nothing else mounts until a language (`es`/`en`) is chosen.
3. Onboarding overlay — if `@onboarding_completed` isn't set, `Onboarding` (`src/components/onboarding/Onboarding.tsx`) is rendered as an absolutely-positioned overlay on top of the navigator (fade-out on finish), not as a stack screen. It can also be re-opened later by tapping the logo (`onShowOnboarding`).

Once past those gates, a React Navigation native-stack (`RootStackParamList`) drives two screens:
- `Guides` → `GuideList` (`src/components/guides/GuideList.tsx`): fetches and lists available guides.
- `Map` → `MainApp` (defined inline in `App.tsx`): the active-tour screen, receives `guideId` via route params.

### Tour/location logic (`useMain.tsx`)

`useMain.tsx` lives at the repo root (sibling to `App.tsx`, not under `src/`) and is the hook (`useMainHook`) powering the `Map`/`MainApp` screen. It owns:
- Loading a guide's stops via `fetchStoryLocations(guideId)` on mount/guide change.
- `react-native-geolocation-service` watch lifecycle (`startWatching`/`stopWatching`), requiring "Always" location permission (background tracking, `foregroundService: true`).
- Proximity detection: on each position update, every unplayed stop within `PROXIMITY_RADIUS` (20m, via `geolib.getDistance`) is marked played and triggers narration.
- Audio gating: a single `isAudioLocked` flag with a fixed `AUDIO_COOLDOWN_MS` (10s) prevents overlapping/repeated narration — it is not a per-location lock, so any nearby trigger during cooldown is dropped, not queued.
- `nearestUnplayedLocation`, used to draw a guidance polyline on the map and power the "guide me" toggle (`isGuideActive`).
- TTS engine init/teardown tied to `ttsLang` (`initTTS`/`releaseTTS` from `tts-sherpa.ts`), reporting success/failure back up via the `onTTSInitResult` callback so `App.tsx` can fall back to the language picker on init failure.

### Data layer (`src/services/AirtableService.ts`)

All content (guides + their stops) comes from a single Airtable base/table via plain `fetch`, authenticated with `AIRTABLE_ACCESS_TOKEN`. There is no backend of its own. Two shapes are derived from the same records:
- `fetchGuides()` groups all records by an `Internal ID` field into one `Guide` card per unique ID (name/duration/city/country/price backfilled from whichever row has them set).
- `fetchStoryLocations(guideId)` filters records to one guide (`filterByFormula`) and returns ordered `StoryLocation` stops with bilingual descriptions (`description` / `description_en`).

Airtable field names are inconsistent (mixed casing, Spanish/English) — the service normalizes this with fallback chains (`f.title ?? f.Title`, etc.); follow that pattern when reading new fields rather than assuming a single canonical key.

### Offline TTS (`src/services/tts-sherpa.ts`)

Wraps `react-native-sherpa-onnx-offline-tts` (on-device Piper/Sherpa-ONNX models, no network calls at speak-time). Per-language model files (`.onnx` + tokens + `espeak-ng-data`) are bundled as iOS app resources under `ios/vits-piper-es_ES-miro-high/` and resolved at runtime from `RNFS.MainBundlePath`; `initTTS` checks each file exists before initializing and returns `false` if any are missing, rather than throwing. Only one language's model can be loaded at a time (`currentLang`); switching languages re-initializes the engine. `speakAborted`/`abortSpeak()` is a cooperative cancel flag, not a true audio stop.

### Map rendering (`src/components/map/LocationsMap.tsx`)

`react-native-maps` view that is purely presentational — it receives `currentPosition`, `storyLocations`, and `targetLocation` as props and has no knowledge of geolocation watching or TTS. Pin color encodes state (`blue` = current target, `green` = played, `red` = unplayed); auto-centers on the user once via a `hasCentered` ref (won't re-center after that, by design).

### Auth scaffolding (not wired in)

`src/components/login/` (Google Sign-In via `@react-native-google-signin/google-signin`) and `src/context/loginContext.ts` exist but are **not** mounted anywhere in `App.tsx`'s current screen flow — the app currently ships without a login step. Treat these as in-progress/parked, not dead code to delete without confirming with the user.

`src/classes/location.ts` / `src/classes/locations.ts` are minimal placeholder classes from the initial scaffold and are not referenced elsewhere in the app; the real location model is the `StoryLocation` interface in `AirtableService.ts`.

### Styling

No styling library or theming system — each component/screen defines its own `StyleSheet.create` block colocated in the file (or, for the root, in `App.style.ts`). Shared colors live in `src/constants/colors.ts` (`green.*`, `white.*`); prefer extending that palette over hardcoding new hex values.

## Native project notes

- iOS `Podfile` includes a patch for `xcodeproj` not recognizing `objectVersion 70` (Xcode 26+) — needed for `pod install` to succeed on newer Xcode; don't remove it without checking the Xcode/CocoaPods versions in use.
- iOS `Info.plist` requests `NSLocationAlwaysUsageDescription`/`NSLocationAlwaysAndWhenInUseUsageDescription` for background tracking during an active tour.
- Android only declares `INTERNET` in the manifest; background/always-location Android support has not been implemented (`requestLocationPermission` in `useMain.tsx` currently returns `false` on non-iOS).
