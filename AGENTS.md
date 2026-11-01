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

Prefer **local Android builds for routine testing**: `bun run android:local` for development and `bun run android:release` for a standalone release APK. On Windows, these scripts configure Bun, Android SDK, and CMake for long native paths. Use `-Mock` explicitly when testing the UI without a backend; this produces simulated screening results. See [`docs/android-local.md`](./docs/android-local.md). Verify tap/navigation behavior in a release APK before a cloud build.

Use EAS for shared/cloud builds, signing, store submission (`eas build`, `eas submit`), and over-the-air updates (`eas update`). Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
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

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- People: `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
