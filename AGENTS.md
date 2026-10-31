This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md


---

# PNEUMOTrack — Project Context

This app is **PNEUMOTrack**, a mobile AI app that screens children for pneumonia risk from cough sound. The full product spec lives in [`PRD.md`](./PRD.md).

**Read `PRD.md` before starting any feature, screen, or API work.** It defines the goals, user flow, screen list, functional requirements, AI pipeline, assumed API contract, safety rules, and MVP scope. If a task conflicts with `PRD.md`, or the PRD is silent on something important, ask the user instead of guessing.

## Non-negotiable rules (details in PRD.md §11 and §13)

- This is a **screening aid, not a diagnosis**. Never write "your child has pneumonia"; use risk wording such as "indikasi risiko pneumonia". Show a disclaimer on result and recommendation screens.
- Never present the proposal's 96.3% figure as clinical accuracy in the UI.
- Recordings and children's data are sensitive: no logging of audio or personal data, no secrets in the repo, and only `EXPO_PUBLIC_*` variables for non-secret config.
- Handle bad audio (too short, noisy, no cough) and network failure on every screen that depends on them.

## Project conventions

- The mobile app sends audio to the FastAPI backend and renders the response; it does not run the ML models locally unless asked.
- Backend data (children, history, doctors, hospitals, articles) goes through Supabase; mock data is allowed during the hackathon but keep it isolated in `src/services/` so it can be swapped.
- Keep UI copy and theme values in central files (`src/constants/`), default language Indonesian, calm teal/blue palette with red/pink reserved for risk states.
- Keep screens thin: logic in `src/hooks/` and `src/services/`, presentational pieces in `src/components/`. Use strict TypeScript and type API responses.
- Verify audio, location, and map modules against the docs for the installed SDK version; do not assume `expo-av` versus `expo-audio`.
- Prioritize a working end-to-end flow (record → analyze → result → recommendation) before polish.
