# PNEUMOTrack: Comprehensive UI/UX Audit & Design Improvement Specification

> **Reading this as:** Pediatric pneumonia cough-screening mobile health application for parents and caregivers in Indonesia, in a Refined & Polished Modern Minimalist medical assistant style, dial **ENERGY 1 / RHYTHM 2 / MOTION 1**.

- **Target Style:** Refined & Polished version of the current identity / Modern Minimalist
- **Audit Scope:** Static Codebase Inspection + Live Runtime Testing across all Expo Router routes, states, viewports, and Light/Dark themes
- **Application Stack:** Expo SDK 58 (`~58.0.22`), React Native `0.88.1`, React `19.3.0`, Expo Router (`~58.0.29`), NativeWind `4.2.7` (Tailwind CSS `3.4.17`), `@expo/ui` (`~58.0.26`), `expo-symbols`, `expo-image`, `expo-audio`, `react-native-reanimated` (`4.7.1`), `react-native-safe-area-context` (`~5.10.1`), `react-native-svg` (`15.16.0`)

---

## 1. Executive & Runtime Summary

### 1.1 Overview of Styling & Architecture Setup
PNEUMOTrack implements a hybrid token architecture:
1. **Single Source of Truth Palette (`src/constants/palette.json`):** Defines 19 semantic color keys for both `light` and `dark` schemes (`surface`, `surfaceMuted`, `surfaceCard`, `surfaceBrand`, `surfaceBrandSoft`, `border`, `ink`, `inkMuted`, `iconMuted`, `brand`, `brandStrong`, `onBrand`, `risk`, `onRisk`, `surfaceRisk`, `borderRisk`, `safe`, `surfaceSafe`).
2. **Runtime CSS Variables (`src/components/ui/theme-root.tsx`):** Reads `palette.json` and injects RGB channel CSS variables (`--color-<name>`) at the root `<View>` via NativeWind's `vars()` API, switching between `themes.light` and `themes.dark` based on `useColorScheme()`.
3. **Tailwind / NativeWind Configuration (`tailwind.config.js`):** Maps semantic utility classes (`bg-surface`, `text-ink`, `bg-brand`, `bg-risk-surface`, etc.) to `rgb(var(--color-<name>) / <alpha-value>)`, and defines semantic typography tokens (`text-display`, `text-title`, `text-subtitle`, `text-body`, `text-label`, `text-caption`), border radius tokens (`rounded-card` = `16px`, `rounded-sheet` = `24px`, `rounded-pill` = `999px`), and `max-w-content` (`800px`).
4. **Numeric JS Theme Bridge (`src/constants/theme.ts` & `src/hooks/use-theme.ts`):** Exposes `Colors`, `Spacing`, and `UI` constants for props that do not accept `className` (`SymbolView` `tintColor`, `ActivityIndicator` `color`, `TextInput` `placeholderTextColor`, `@expo/ui` `Host` and `BottomSheet`, `react-native-svg` fills).

### 1.2 Live Runtime Testing Coverage & Click-Through Evidence
The application was started via `expo start --web --port 8081` and inspected live in a real browser across mobile (`390x844` iPhone 14/15), narrow mobile (`320x568`), and tablet (`768x1024`) viewports in both Light (`prefers-color-scheme: light`) and Dark (`prefers-color-scheme: dark`) modes:
- **Boot & SSR Verification (`/`):** Initial launch without `.env` threw HTTP 500 (`Server Error: supabaseUrl is required` in `src/services/supabase/client.ts`). After supplying mock environment variables, `/` cleanly evaluated session state and redirected unauthenticated users to `/(auth)/sign-in`.
- **Authentication Flow (`/(auth)/sign-in`, `/(auth)/sign-up`):**
  - Clicked `Masuk` with empty fields -> rendered inline error banner (`Email dan kata sandi wajib diisi.`).
  - Clicked `Masuk sebagai Demo` without live Supabase backend -> showed loading spinner on both buttons simultaneously, caught network failure, and rendered `"Akun demo tidak tersedia. Silakan buat akun baru."`.
  - Clicked `Daftar` -> navigated to `/(auth)/sign-up`. Tested sequential validation: empty submit (`"Nama wajib diisi."`), invalid email (`"Email tidak valid."`), and short password (`"Kata sandi minimal 8 karakter."`). Clicked `Masuk` -> returned to `/(auth)/sign-in`.
- **Component Gallery & Simulation Engine (`/dev/components`):**
  - Inspected all card variants, button states (`primary`, `secondary`, `risk`, `ghost`, `loading`, `disabled`), `StatusBanner`, `Avatar`, `Badge`, `Waveform` (static, risk, live, empty), `EmptyState`, `LoadingState`, `ErrorState`, `Disclaimer`, and `DangerSignsBox`.
  - Clicked `Contoh Detail` (`Collapsible`) -> expanded and collapsed content.
  - Clicked `Buka Menu` (`MenuSheet`) -> opened full-height bottom sheet overlay; dismissed cleanly via `Tutup`.
  - Executed Mock Scenarios:
    - Selected `Normal` + `Jalankan Simulasi` -> transitioned to `/screening/analyzing` (pulsing logo + skeleton loader) -> auto-navigated to `/screening/result` (Normal banner, 32-bar waveform, summary card, danger signs box).
    - Selected `Risiko` + `Simulasi Gagal Simpan` + `Jalankan Simulasi` -> transitioned to `/screening/result` (Risk banner, `Hasil belum tersimpan ke riwayat` alert card with `Simpan Ulang` retry button, `Lihat Rekomendasi Tindakan` risk CTA).
    - Clicked `Lihat Rekomendasi Tindakan` -> navigated to `/recommendation` (Risk status banner, doctor and hospital action cards, `DangerSignsBox` with `Hubungi Darurat 119` CTA).
    - Selected `Model Berbeda` -> verified disagreement warning card and badge on `/screening/result`.
    - Selected `Audio Bising` (`AUDIO_TOO_NOISY`) -> verified `/screening/analyzing` halted with audio error state (`Rekaman belum dapat dianalisis`) and `Rekam Ulang` action.
- **Root Tabs & Unauthenticated Resilience (`/(tabs)`, `/(tabs)/history`, `/(tabs)/children`, `/(tabs)/monitoring`, `/(tabs)/more`):**
  - Navigated to `/(tabs)` without an active Supabase auth session -> `ActiveChildProvider` received `parentId = null` and returned an empty child list even in mock mode, forcing `/(tabs)`, `/(tabs)/history`, `/(tabs)/children`, and `/(tabs)/monitoring` into their `"Tambahkan Profil Anak"` / `"Belum Ada Profil Anak"` empty states instead of loading `MOCK_CHILDREN` (`Budi Santoso` and `Ayu Lestari`).
  - Tested bottom navigation tabs (`Beranda`, `Riwayat`, `Anak`, `Menu`) and verified `MenuSheet` navigation to `/(tabs)/monitoring`, `/articles`, and `/(tabs)/more`.
- **Feature Flows (`/children/new`, `/screening/guide`, `/screening/record`, `/doctors`, `/doctors/[id]`, `/chats`, `/chats/[id]`, `/hospitals`, `/hospitals/map`, `/articles`, `/articles/[id]`, `/history/[id]`):**
  - `/children/new`: Typed `"Aisyah Putri"` -> live avatar updated initials to `"AP"`; toggled `SegmentedTabs` (`Laki-laki` / `Perempuan`).
  - `/doctors` & `/doctors/doc-001`: Filtered doctors by typing `"Paru"` -> narrowed 6 doctors to 2 pulmonologists; opened `Dr. I Gusti Ngurah Anom, Sp.A` detail screen; clicked `Mulai Konsultasi` -> navigated to `/chats/doc-001`.
  - `/chats` & `/chats/doc-001`: Listed mock conversations (`parentId` falls back to `"user-demo"`); typed `"Halo dokter, anak saya batuk sejak semalam"` and clicked `Kirim` -> appended parent bubble to scroll view.
  - `/hospitals` & `/hospitals/map`: Verified Denpasar location fallback notice, hospital rows, search filtering on `/hospitals/map`, and `Buka di Peta` action cards.
  - `/articles` & `/articles/art-001`: Tested category filter pills (`Semua`, `Gejala`, `Pencegahan`, `Penanganan`, `Edukasi`) and search input; opened `/articles/art-001` and observed raw unparsed Markdown symbols (`##`, `**`, `-`) rendered as plain text.
  - `/history/scr-001` & `/history/scr-002`: Verified normal and risk historical screening detail views.

### 1.3 Core UI/UX Pain Points Observed During Runtime
1. **Broken Dark Mode Inheritance Across Custom Scroll Containers:** Because `ThemeRoot` applies `--color-*` CSS variables on its root `<View>`, NativeWind's `darkMode: "media"` generates `@media (prefers-color-scheme: dark)` rules for `dark:*` utilities that also point to those same variables. However, on Web and React Native, components that omit `dark:bg-surface-dark` or mix `dark:*` classes inconsistently cause jarring visual mismatches between screens wrapped in `<Screen>` (such as `/dev/components`) and screens using raw `<ScrollView className="flex-1 bg-surface">` or `<View className="flex-1 bg-surface">`, and leave user-selected theme preferences unsupported.
2. **Unparsed Markdown in Article Reader (`/articles/[id]`):** `article.body_md` is rendered directly inside a plain `<Text>` node, exposing raw `## Heading`, `**bold**`, and `- list` syntax to parents.
3. **Mock Mode Session Disconnect (`src/app/_layout.tsx` & `src/hooks/use-session.ts`):** While `ChatsListScreen` and `ChatRoomScreen` fall back to `user?.id ?? "user-demo"`, `SessionBoundProviders` in `src/app/_layout.tsx` passes `parentId={user?.id ?? null}` to `ActiveChildProvider`. In mock mode (`Config.useMockData === true`) without a live Supabase server, `SignInScreen`'s `"Masuk sebagai Demo"` fails and `parentId` stays `null`, hiding `MOCK_CHILDREN` and `MOCK_SCREENINGS` across the entire Dashboard, History, Children, and Monitoring tabs.
4. **Fatal SSR Crash When `.env` Is Missing (`src/services/supabase/client.ts`):** `createClient(Config.supabaseUrl, Config.supabaseAnonKey)` is called unconditionally at module import time with empty strings, crashing Expo Router web SSR before any UI can render.
5. **No User-Facing Theme Switcher (`R-21` / `R-34`):** `copy.ts` defines `copy.gallery.appearance`, `system`, `light`, and `dark`, and `PRD.md` / `design.md` specify Settings in `Menu` / `More`, yet no theme toggle exists in the app UI.
6. ** Cramped Doctor List & Hospital List Information Hierarchy:** In `/doctors` (verified in live screenshot `final_step_203.png`), each row stacks 4 text lines with no chevron affordance, no specialty pill, no star icon next to `"Penilaian 4,9"`, and awkward initials (`"DI"` for `"Dr. I Gusti..."`, `"DN"` for `"Dr. Ni Made..."` because `"Dr."` is used as the first word of the initials).
7. **Full-Height Bottom Sheet & Unstyled Menu Actions (`src/components/ui/menu-sheet.tsx`):** `MenuSheet` configures `snapPoints={["full"]}` and renders centered ghost buttons instead of a compact half-sheet with left-aligned icon rows, drag handle, and clear visual hierarchy.
8. **Missing Visual Polish & Ergonomic Details:**
   - Search inputs on `/doctors`, `/articles`, and `/hospitals/map` have redundant visible labels repeating their placeholders and lack leading search icons or clear (`X`) buttons.
   - `ChatRoomScreen` stacks a tall 3-row footer (`Tulis pesan` label + full-width `TextInput` + full-width `Kirim` button) that consumes over 160px of vertical height and crowds the viewport when the keyboard opens, instead of an inline horizontal composer bar.
   - `NewChildScreen` requires manual typing of `YYYY-MM-DD` without numeric keyboard formatting or auto-hyphenation, and uses blocking native `Alert.alert` modals for form validation instead of inline field errors.
   - `ScreenHeader` injects `"Data simulasi untuk pengujian."` into every single screen header when `Config.useMockData` is true, cluttering navigation chrome across all 18 screens.

---

## 2. Token & Theme Specification

### 2.1 One-Line Design Decisions (`R-31`)
- **Why this color palette:** Deep clinical navy (`#1F4B75`) and soft sky blue (`#D6E9F4` / `#EAF4F9`) establish calm, reassuring authority for anxious parents, while reserving muted crimson (`#963232` / `#F4D6D6`) exclusively for pneumonia risk alerts and danger signs.
- **Why this layout structure:** A single-column, top-to-bottom narrative with a 64px 4-tab bottom bar keeps primary screening actions within one-handed thumb reach and prevents cognitive overload during child illness.
- **Why this typography scale:** System sans-serif (SF Pro / Roboto) at a minimum 16px body size (`24px` line-height) and 6-tier modular scale (`12px` to `32px`) guarantees immediate legibility for parents and older caregivers without custom font network overhead.
- **Why this spacing scale:** A strict 4px/8px base rhythm (`20px` screen gutter, `16px` card padding, `12px` intra-section gap, `24px` inter-section gap) creates structural breathing room that separates clinical metrics from action controls.
- **Why use cards:** Bordered and tinted cards (`16px` radius) group related clinical context (child identity, acoustic waveform, AI screening summary, emergency danger signs) into distinct scannable containers without relying on heavy drop shadows.
- **Why use these icons:** Platform-native vector symbols (`expo-symbols` / Material Symbols) paired with Indonesian text labels provide familiar, high-contrast signifiers for medical facilities, stethoscopes, audio waveforms, and status alerts.

### 2.2 Semantic Color Token Updates (`src/constants/palette.json` & `src/constants/theme.ts`)
Maintain `src/constants/palette.json` as the single source of truth (all existing pairings already pass WCAG AA `4.5:1` text contrast and `3.0:1` boundary contrast as verified by `src/constants/palette.test.cjs`). Add the following missing semantic tokens to `palette.json`, `src/constants/theme.ts`, and `tailwind.config.js` without creating a parallel theme system:

| Semantic Token (`palette.json`) | Tailwind Utility Name | Light Hex | Dark Hex | Contrast & Purpose |
|---|---|---|---|---|
| `borderSubtle` | `border-subtle` | `#DCE4EC` | `#243244` | Decorative hairlines, list row dividers, and card internal separators (replaces ad-hoc `border-border/40` opacity modifiers). Keep `border` (`#738497` light / `#718399` dark, `>= 3.0:1`) for form input borders and interactive control boundaries. |
| `warning` | `warning` | `#8A4B08` | `#F5B971` | Caution text and icon tone for noisy room (`noisy`), model disagreement (`disagreement`), and location fallback banners (`>= 4.5:1` on `surfaceWarning` and `surface`). |
| `surfaceWarning` | `surface-warning` | `#FDF3E7` | `#332414` | Caution card/banner background so warning states are visually distinct from informational `surfaceBrandSoft` (`#EAF4F9`) and critical `surfaceRisk` (`#F4D6D6`). |
| `borderWarning` | `border-warning` | `#D99B52` | `#8A5A24` | 1px border token for `warning` cards and banners (`>= 3.0:1` against `surfaceWarning`). |
| `scrim` | `bg-scrim` | `#0B1B2B80` | `#000000B3` | Modal and bottom-sheet backdrop overlay (`50%` navy in light mode, `70%` black in dark mode). |

### 2.3 Theme Mode Architecture & Redundant `dark:*` Cleanup
1. **Unify CSS Variable Resolution (`tailwind.config.js` & `src/components/ui/theme-root.tsx`):**
   - Because `ThemeRoot` dynamically injects `--color-*` RGB values for the active scheme (`light` or `dark`), every semantic token in `tailwind.config.js` (`bg-surface`, `text-ink`, `text-ink-muted`, `bg-surface-card`, `border-border`, `text-brand`, `bg-risk-surface`, etc.) automatically resolves to the active theme's color.
   - Change `darkMode: "media"` in `tailwind.config.js` to `darkMode: "class"` (or rely purely on `ThemeRoot` `vars()` context) and add a persisted user preference in `useColorScheme` (`"system" | "light" | "dark"`, stored in `AsyncStorage` under key `pneumo:theme_preference`).
   - Remove redundant `dark:bg-*-dark` and `dark:text-*-dark` paired classes across components, OR ensure `ThemeRoot` applies the `dark` class on web when the resolved scheme is `"dark"` so web SSR and client hydration never desynchronize between `<Screen>` and raw `<ScrollView>` containers.

### 2.4 Typography, Spacing, Radius & Elevation Tokens (`src/constants/theme.ts` & `tailwind.config.js`)
- **Typography Scale (`tailwind.config.js`):**
  - `text-display`: `32px` font size, `40px` line height, `700` weight (`font-bold`), maximum one per screen (Splash tagline, Record timer).
  - `text-title`: `24px` font size, `32px` line height, `700` weight (`font-bold`), screen primary headings (`Beranda` greeting, `Panduan Rekaman` heading, Article title, Doctor name on detail).
  - `text-subtitle`: `18px` font size, `26px` line height, `600` weight (`font-semibold`), `ScreenHeader` title, section headers, card titles.
  - `text-body`: `16px` font size, `24px` line height, `400` weight (`font-normal`) or `600` (`font-semibold`), body copy, list item titles, input text.
  - `text-label`: `14px` font size, `20px` line height, `600` weight (`font-semibold`), button labels, form field labels, badges, filter pills.
  - `text-caption`: `12px` font size, `16px` line height, `400` weight (`font-normal`), timestamps, helper hints, non-diagnostic disclaimer, bottom tab labels.
- **Icon Size Tokens (`src/constants/theme.ts` -> `UI`):**
  - Replace the single `UI.iconSize: 24` with a 4-step token scale: `iconSm: 16` (inline metadata, rating star, badge icon), `iconMd: 20` (input leading/trailing icons, compact button icons), `iconLg: 24` (navigation bar, header actions, list leading icons), `iconXl: 32` (`EmptyState` and `ErrorState` hero icons inside a `56x56` tinted circle).
- **Avatar Size Tokens (`src/constants/theme.ts` -> `UI`):**
  - Standardize `Avatar` sizes: `sm: 40` (compact header/chat), `md: 48` (list rows: Doctors, Chats, Children switcher), `lg: 64` (Profile cards, Add Child preview), `xl: 80` (Doctor Detail hero).
- **Content Width & Responsive Gutter Tokens (`src/constants/theme.ts`):**
  - Add `MaxFormWidth: 480` (`max-w-[480px]`) for Auth forms (`/sign-in`, `/sign-up`, `/children/new`) and `MaxContentWidth: 640` (`max-w-[640px]`, reduced from `800px`) so mobile-first cards, buttons, and banners do not stretch excessively wide on 768px+ tablet and desktop web viewports.

---

## 3. Screen-by-Screen & Component Directives

### 3.1 Global Shell, Providers & Navigation (`src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/(tabs)/_layout.tsx`, `src/services/supabase/client.ts`)

#### `src/services/supabase/client.ts`
- **Visual/Runtime Issue:** Calling `createClient(Config.supabaseUrl, Config.supabaseAnonKey)` at module import time when `.env` is unset passes `""` as `supabaseUrl`, causing `@supabase/supabase-js` to throw `Error: supabaseUrl is required` and crashing Expo Router web SSR with HTTP 500 on every route.
- **Design Directive:** Provide safe fallback strings (`Config.supabaseUrl || "http://127.0.0.1:54321"` and `Config.supabaseAnonKey || "public-anon-key-placeholder"`) when instantiating `createClient`, and bypass network auth calls in `useSession` when `Config.useMockData` is `true`.

#### `src/app/_layout.tsx` & `src/hooks/use-session.ts`
- **Visual/Runtime Issue:**
  1. `Stack` sets `animation: "none"` globally, making every push/pop navigation feel abrupt and jarring.
  2. When `Config.useMockData` is `true` and no Supabase backend is running, `user` is `null`, so `SessionBoundProviders` passes `parentId={null}` to `ActiveChildProvider`. Consequently, `ActiveChildProvider` resolves an empty child list (`[]`) instead of `MOCK_CHILDREN`, leaving Dashboard, History, Children, and Monitoring stuck in empty states during demo/mock testing.
- **Design Directive:**
  1. In `SessionBoundProviders` (`src/app/_layout.tsx`), resolve `parentId` as `user?.id ?? (Config.useMockData ? "user-demo" : null)` (matching `ChatsListScreen` and `ChatRoomScreen`), and in `useSession.ts` (`signIn`), when `Config.useMockData` is `true` and the email is `"demo@pneumotrack.id"`, synthesize a local demo `User` (`id: "user-demo"`, `email: "demo@pneumotrack.id"`, `user_metadata: { full_name: "Bunda Sari" }`) so `"Masuk sebagai Demo"` works offline/without Supabase.
  2. In `RootLayout` (`src/app/_layout.tsx`), change `Stack` `screenOptions.animation` from `"none"` to `"slide_from_right"` on native (respecting reduced motion via `useReduceMotion()`).

#### `src/app/index.tsx` (Entry / Splash Screen)
- **Visual/Runtime Issue:** Renders both `copy.common.appName` and `copy.common.tagline` using identical `text-title font-bold text-brand` styling, creating two competing `24px` bold headings stacked together with no visual hierarchy.
- **Design Directive:** Render `copy.common.appName` in `text-display font-bold text-brand` (`32px`/`40px`) and `copy.common.tagline` in `text-body font-normal text-ink-muted text-center` (`16px`/`24px`) with `mt-1` (`4px` gap) inside a `max-w-[280px]` container.

#### `src/app/(tabs)/_layout.tsx` (Bottom Navigation Bar)
- **Visual/Runtime Issue:**
  1. When `menuOpen` is `true`, the `Menu` tab button keeps `tone="muted"` and `text-ink-muted`, providing no visual indication that the menu sheet is active.
  2. `TabButton` uses `text-ink-muted` for inactive labels while its icon uses `tone="muted"`, which maps to `theme.inkMuted` instead of `theme.iconMuted` in `Icon`.
- **Design Directive:**
  1. Update the `Menu` tab `Pressable` so when `menuOpen` is `true`, `<Icon name="menu" />` uses `tone="brand"` and `selected={true}`, and its `<Text>` uses `font-bold text-brand`.
  2. Add an active top indicator pill (`h-0.5 w-6 rounded-pill bg-brand`) or subtle pill container (`px-3 py-1 rounded-pill bg-surface-brand/60`) around the active tab icon so active state is communicated by shape as well as color/weight (`R-39`, non-text contrast).

---

### 3.2 Shared UI Primitives (`src/components/ui/*` & `src/components/screening/*`)

#### `src/components/ui/screen-header.tsx`
- **Visual/Runtime Issue:**
  1. Renders `Config.useMockData && <Text>{copy.screening.dataDemo}</Text>` (`"Data simulasi untuk pengujian."`) inside every screen's top navigation bar, adding a third line to headers and visually crowding all 18 screens.
  2. The root container uses `flex-wrap`, which can cause the trailing action slot to wrap onto a second line on narrow (`320px`) screens if the title is long.
- **Design Directive:**
  1. Remove the `Config.useMockData` subtitle from `ScreenHeader`. Instead, show a single compact `Badge` (`variant="muted"`, label `"Mode Simulasi"`) only on the Dashboard greeting row and the Component Gallery header.
  2. Remove `flex-wrap` from the outer header row (`min-h-14 flex-row items-center justify-between gap-2 py-1`), enforce `numberOfLines={1}` on the header title (`text-subtitle font-semibold text-ink`), and keep left and right action containers fixed at `h-11 w-11 shrink-0 items-center justify-center`.

#### `src/components/ui/menu-sheet.tsx`
- **Visual/Runtime Issue:**
  1. `BottomSheet` sets `snapPoints={["full"]}`, forcing a simple 4-item navigation menu to cover 100% of the screen height.
  2. Menu items are rendered using `<Button variant="ghost" />`, which centers text horizontally with no leading icons, no row dividers, and no visual grouping, making the menu look like floating centered links in an empty full-screen page.
- **Design Directive:**
  1. Change `BottomSheet` `snapPoints` from `["full"]` to `["medium"]` (or `[0.55]` / auto-content height) and add a centered top drag handle (`h-1 w-10 self-center rounded-pill bg-border-subtle mb-4`).
  2. Replace the centered `ghost` buttons with left-aligned `ListRow` items inside a `Card` (`variant="default"`, `p-0 overflow-hidden`), each displaying its semantic leading `<Icon tone="brand" />` (`profile` for `Profil Anak`, `mic` for `Monitoring`, `article` for `Artikel & Berita`, `menu` for `Pengaturan & Tentang`), title (`text-body font-semibold text-ink`), and trailing chevron (`chevronRight`), followed by a `secondary` full-width `Tutup` button at the bottom.

#### `src/components/ui/avatar.tsx`
- **Visual/Runtime Issue:**
  1. Fixed at `h-16 w-16` (`64x64px`) everywhere, which is oversized for dense list rows (`ArticleRow`, `DoctorsScreen`, `ChatsListScreen`) and undersized for `DoctorDetailScreen`.
  2. Initials extraction (`name.trim().split(/\s+/).slice(0, 2)`) includes honorific prefixes like `"Dr."`, producing `"DI"` for `"Dr. I Gusti Ngurah Anom"` and `"DN"` for both `"Dr. Ni Made Dewi Sari"` and `"Dr. Ni Nyoman Tri Agustini"` (visible in live screenshot `final_step_203.png`).
- **Design Directive:**
  1. Add a `size?: "sm" | "md" | "lg" | "xl"` prop to `Avatar`: `sm` = `h-10 w-10` (`text-label`), `md` = `h-12 w-12` (`text-body`), `lg` = `h-16 w-16` (`text-subtitle`, default), `xl` = `h-20 w-20` (`text-title`).
  2. Strip common Indonesian medical/academic prefixes (`/^((dr|drg|prof|ir|h|hj)\.?\s+)+/i`) before computing the 2-letter initials so `"Dr. I Gusti Ngurah Anom, Sp.A"` displays `"IG"` and `"Dr. Ni Made Dewi Sari, Sp.A"` displays `"NM"`.

#### `src/components/ui/article-row.tsx`
- **Visual/Runtime Issue:** Uses a circular `<Avatar name={article.category} />` (`64x64` circle showing `"GE"` for Gejala, `"PE"` for Pencegahan, `"ED"` for Edukasi) as the leading element for news articles, making articles look like user profiles, and lacks a trailing chevron or card container.
- **Design Directive:** Replace the circular `Avatar` in `ArticleRow` with a `48x48px` rounded-square icon badge (`h-12 w-12 rounded-xl bg-surface-brand-soft items-center justify-center`) containing `<Icon name="article" tone="brand" />` (or a `56x56px` `rounded-xl` cover `Image` when `article.cover_url` is present), add `numberOfLines={2}` to the article title, and append `<Icon name="chevronRight" tone="muted" />` on the right.

#### `src/components/ui/list-row.tsx`
- **Visual/Runtime Issue:** `ListRow` is defined in `src/components/ui/list-row.tsx` with a hardcoded literal character `<Text className="text-xl">›</Text>` instead of `<Icon name="chevronRight" />`, lacks `min-h-12`, and is not actually used by any screen (`DoctorsScreen`, `HospitalsScreen`, `HistoryScreen`, `ChatsListScreen`, and `MoreScreen` all duplicate custom inline `<Pressable>` rows).
- **Design Directive:** Update `ListRow` to enforce `min-h-14` (`56px`), `border-b border-subtle`, and `<Icon name="chevronRight" tone="muted" />` instead of the raw `›` character, and adopt `ListRow` across `MoreScreen`, `HospitalsScreen`, `DoctorsScreen`, and `ChatsListScreen`.

#### `src/components/ui/empty-state.tsx` & `src/components/ui/error-state.tsx`
- **Visual/Runtime Issue:**
  1. `ErrorState` is left-aligned (`gap-4 py-6` without `items-center` or `text-center`), whereas `EmptyState` is centered (`items-center gap-4 py-6`), creating visual jarring when switching between empty and error states in the same container.
  2. Both render a bare `24x24px` muted icon (`<Icon name="empty" tone="muted" />` / `<Icon name="error" tone="muted" />`) floating above `18px` bold text, which looks tiny and visually weak.
- **Design Directive:**
  1. Center-align `ErrorState` (`items-center gap-3 py-6 px-4`) with `text-center` on both title and description to match `EmptyState`.
  2. Wrap the leading icon in both `EmptyState` and `ErrorState` inside a `56x56px` circular tinted surface: `h-14 w-14 items-center justify-center rounded-full bg-surface-brand-soft` with `tone="brand"` for `EmptyState`, and `bg-risk-surface` with `tone="risk"` for `ErrorState`.

#### `src/components/ui/badge.tsx` & `src/components/ui/status-banner.tsx`
- **Visual/Runtime Issue:**
  1. `Badge` variants `disagreement` and `warning` use `bg-surface-brand-soft` and `text-brand`, making warning badges visually identical to `normal` / `brand` badges (`color-only` / semantic ambiguity).
  2. `StatusBanner` in `normal` variant uses `Card variant="brand"` (`bg-surface-brand`) and `Icon name="check" tone="brand"`, never utilizing the `safe` (`#186449` / `#7CDDB8`) or `surfaceSafe` (`#D9EFE7` / `#16332A`) tokens defined in `palette.json` and `design.md` §6.
- **Design Directive:**
  1. In `Badge`, map `disagreement` and `warning` variants to `bg-surface-warning border border-border-warning` with `text-warning`.
  2. In `StatusBanner`, use `Card variant="safe"` (`bg-surface-safe`) or a `32x32px` circular icon container (`h-8 w-8 rounded-full bg-surface-safe items-center justify-center`) with `<Icon name="check" tone="safe" />` for `normal`, and `<Icon name="warning" tone="risk" />` inside `bg-risk-surface` for `risk`, vertically centered (`items-center`) with the headline.

#### `src/components/ui/segmented-tabs.tsx`
- **Visual/Runtime Issue:** Each tab item sets `min-w-[120px]` inside a `flex-row flex-wrap` container. On `320px` viewports or when 3+ tabs are used, tabs wrap into multiple stacked rows instead of sitting side-by-side as a segmented control.
- **Design Directive:** Remove `flex-wrap` and `min-w-[120px]` from `SegmentedTabs`; use `flex-row items-center gap-1 rounded-pill bg-surface-brand-soft p-1` on the container and `min-h-11 flex-1 items-center justify-center rounded-pill px-3 py-2` on each tab button with `numberOfLines={1}`.

#### `src/components/screening/noise-meter.tsx` & `src/components/screening/offline-banner.tsx`
- **Visual/Runtime Issue:**
  1. In `NoiseMeter`, when `status === "noisy"`, the status text and progress bar fill remain `text-brand` and `bg-brand`, giving the exact same blue visual treatment for `"Ruangan terlalu berisik"` as for `"Ruangan cukup tenang"` (`design.md` §8 specifies caution styling for noisy rooms).
  2. `OfflineBanner` uses `Card variant="soft"` (`bg-surface-brand-soft`) and `tone="brand"`, blending into normal informational cards instead of standing out as a connectivity warning.
- **Design Directive:**
  1. In `NoiseMeter`, style `status === "safe"` with `text-safe` and bar fill `bg-safe`, `status === "noisy"` with `text-warning` (or `text-risk`) and bar fill `bg-warning`, and `checking`/`unknown` with `text-brand` and `bg-brand`.
  2. In `OfflineBanner`, use the `warning` surface (`bg-surface-warning border-border-warning`) and `<Icon name="error" tone="warning" />`.

---

### 3.3 Route-by-Route Screen Directives

#### `src/app/(auth)/sign-in.tsx` & `src/app/(auth)/sign-up.tsx`
- **Visual/Runtime Issue:**
  1. Neither screen constrains its form width on tablet/web (`768px`), causing inputs and buttons to stretch across the full viewport width.
  2. No brand logo is shown above the title on `SignInScreen` or `SignUpScreen`, making the entry screen feel bare.
  3. Clicking `"Masuk sebagai Demo"` sets the same `isLoading` state used by the primary `"Masuk"` button, causing both buttons to display spinning `ActivityIndicator`s at the same time.
  4. Validation errors appear only in a bottom summary box (`rounded-xl bg-risk-surface`) without `accessibilityRole="alert"`, without a leading warning icon, and without highlighting the invalid `TextInput` border.
- **Design Directive:**
  1. Wrap the inner form column in `w-full max-w-[440px] self-center px-5 py-8`.
  2. Add a compact brand header above the title on `SignInScreen`: `logo.png` at `72x72px` (`rounded-2xl`), followed by `copy.app.name` (`text-title font-bold text-brand`) and `copy.auth.signInSubtitle` (`text-body text-ink-muted`). On `SignUpScreen`, include a top-left back button (`ScreenHeader` with `title=""`) so users have a standard top-left back affordance in addition to the bottom link.
  3. Separate `isSigningIn` and `isDemoLoading` states in `SignInScreen` so only the pressed button shows a spinner while the other is `disabled`.
  4. Add `accessibilityRole="alert"` and `<Icon name="warning" tone="risk" />` to the error banner (`flex-row items-center gap-2 rounded-xl border border-risk-border bg-risk-surface px-4 py-3`), and switch empty/invalid `TextInput` borders from `border-border` to `border-risk-border`.

#### `src/app/(tabs)/index.tsx` (Dashboard / Beranda)
- **Visual/Runtime Issue:**
  1. Uses a raw `<ScrollView className="flex-1 bg-surface">` without `max-w-content self-center`, stretching full-bleed on tablet/web.
  2. Greeting section displays only `"Hai, <Name>"` (`text-title font-bold text-ink`) and omits the subtitle defined in `copy.dashboard.subtitle` (`"Pantau kondisi si kecil"`) / `copy.dashboard.subtitleRisk` (`"Perhatikan kondisi si kecil"`).
  3. The active child selector is an uncontained row (`Pressable` with `Avatar` + name + chevron) floating directly on the background instead of a distinct hero card (`design.md` §7.2 specifies a `rounded-card bg-surface-brand p-4` child hero card with name and age pill).
  4. When `screening` is `null` (no screening yet for the active child), the card displays `"Belum ada hasil skrining"` and `"Rekam Batuk"` without the pending status details or explanatory body text.
- **Design Directive:**
  1. Wrap the `ScrollView` children in `<View className="w-full max-w-content self-center gap-6">`.
  2. Render a two-line greeting header: `copy.dashboard.greeting` (`text-title font-bold text-ink`) on line 1, and `risk ? copy.dashboard.subtitleRisk : copy.dashboard.subtitle` (`text-body text-ink-muted`) on line 2.
  3. Place the active child switcher inside a `Card` (`variant="soft"`, `p-3.5`) showing `<Avatar size="md" name={activeChild.name} />`, child name (`text-subtitle font-semibold text-ink`), child age pill (`text-caption text-brand` computed from `activeChild.birth_date`), and a trailing chevron badge.
  4. In the screening status `Card` (`variant={risk ? "risk" : "brand"}`), render the status details in a two-column grid so the card stays readable without a decorative illustration.

#### `src/app/(tabs)/children.tsx` & `src/app/children/new.tsx` (Child Profiles)
- **Visual/Runtime Issue:**
  1. In `ChildrenScreen`, the active child card uses `variant="brand"` (`bg-surface-brand`) and places a `Badge` with `variant="brand"` (`bg-surface-brand`) inside it, making the `"Aktif"` pill background invisible against the card surface!
  2. In `ChildrenScreen`, the action footer inside each card (`Pilih sebagai Anak Aktif` and `Hapus`) uses `justify-between`. When `isActive` is `true`, `"Pilih sebagai Anak Aktif"` is hidden, causing the destructive `"Hapus"` button to jump from the right edge to the far left edge.
  3. In `NewChildScreen`, `KeyboardAvoidingView` sets `behavior={Platform.OS === "ios" ? "padding" : undefined}` (ignoring Android keyboard avoidance), validation errors use blocking native `Alert.alert` dialogs instead of inline messages, and the Birth Date input requires manual typing of hyphens (`YYYY-MM-DD`) with a default qwerty keyboard.
- **Design Directive:**
  1. On `ChildrenScreen`, style the `"Aktif"` badge on the active card with `bg-brand` and `text-on-brand` (or `bg-surface-card` with `text-brand`) so it has clear contrast against `bg-surface-brand`.
  2. Keep the card action row right-aligned (`justify-end` when only `Hapus` is shown, `justify-between` when both actions are shown) so `Hapus` always stays anchored on the right.
  3. On `NewChildScreen`, set `KeyboardAvoidingView` `behavior={Platform.OS === "ios" ? "padding" : "height"}`, auto-format `birthDate` input (`YYYY-MM-DD` with `keyboardType="numbers-and-punctuation"` and `maxLength={10}`), and replace validation `Alert.alert` popups with an inline `accessibilityRole="alert"` error banner matching `SignInScreen`.

#### `src/app/screening/guide.tsx`, `src/app/screening/record.tsx` & `src/app/screening/analyzing.tsx`
- **Visual/Runtime Issue:**
  1. In `GuideScreen` (`src/app/screening/guide.tsx`), the 3 preparation tips (`copy.guide.tips`) are rendered as plain unbulleted, unnumbered paragraphs (`<Text className="text-body text-ink">{tip}</Text>`), blending together without scannable structure.
  2. In `RecordScreen` (`src/app/screening/record.tsx`), the active child's name is rendered as plain centered body text (`<Text className="text-center text-body text-ink">{child.child.name}</Text>`), and error messages (`recorder.isTooShort`, `recorder.interrupted`, `recorder.error`) render as plain unstyled `<Text className="text-body text-ink">` with no alert container, icon, or risk/warning color.
  3. In `AnalyzingScreen` (`src/app/screening/analyzing.tsx`), when `working` is `true`, `<LoadingState />` renders 3 rectangular skeleton placeholder bars (`h-6 w-2/3`, `h-20`, `h-4 w-4/5`) underneath the pulsing logo. Skeleton bars are meant for content lists, not an active audio-processing wait screen (`antislop-ui`: Placeholder Empty and Loading States).
- **Design Directive:**
  1. On `GuideScreen`, render `copy.guide.tips` as a numbered step list (`1`, `2`, `3`) inside a `Card` (`variant="default"`), where each row has a `28x28px` circular number badge (`h-7 w-7 rounded-full bg-surface-brand items-center justify-center` with `text-label font-bold text-brand`) and `flex-1 text-body text-ink`.
  2. On `RecordScreen`, display the active child's name and age inside a centered `Badge` (`variant="brand"`) above the timer, and wrap `recorder.isTooShort`, `recorder.interrupted`, and `recorder.error` inside a `Card` (`variant="risk"` for errors, `variant="soft"` / `warning` for interrupted/tooShort) with `<Icon name="warning" />`.
  3. On `AnalyzingScreen`, replace `<LoadingState />` during `working` with a dedicated centered status block: `ActivityIndicator` (`color={theme.brand}`), status headline (`status === "uploading" ? copy.analyzing.uploading : copy.analyzing.processing` in `text-subtitle font-semibold text-brand text-center`), and helper text (`copy.analyzing.waiting` in `text-body text-ink-muted text-center`).

#### `src/app/screening/result.tsx`, `src/app/recommendation.tsx` & `src/app/history/[id].tsx`
- **Visual/Runtime Issue:**
  1. In `ResultView` (`src/components/screening/result-view.tsx`), the waveform section is not wrapped in a `Card` (unlike `HistoryDetailScreen` which wraps `Waveform` in a `Card`), and lacks the pattern label (`copy.result.normalPattern` `"Pola batuk normal"` / `copy.result.abnormalPattern` `"Pola batuk tidak biasa"`) required by `PRD.md` F4/F5 and `design.md` §7.6/§7.7.
  2. In `RecommendationScreen` (`src/app/recommendation.tsx`), when `result.result === "risk"`, the primary action button `"Mulai Konsultasi"` on the Doctor card uses the default `primary` blue variant instead of `variant="risk"` (`design.md` §7.8 specifies `risk` variant CTA on recommendation cards when risk is active).
  3. `RecommendationScreen` and `HistoryDetailScreen` do not use `<Screen>` (`HistoryDetailScreen` uses a raw `ScrollView` without `max-w-content self-center`).
- **Design Directive:**
  1. In `ResultView`, wrap the waveform section inside a `Card` (`variant="default"`) displaying a header row with `result.result === "risk" ? copy.result.abnormalPattern : copy.result.normalPattern` (`text-subtitle font-semibold text-ink`) and `formatDuration(result.duration_sec)` (`text-caption text-ink-muted`), followed by `<Waveform />`.
  2. In `RecommendationScreen`, wrap the doctor and hospital icon headers in a `44x44px` tinted icon container (`h-11 w-11 rounded-xl bg-surface-brand-soft items-center justify-center`), and when `result?.result === "risk"`, use `variant="risk"` on the `"Mulai Konsultasi"` CTA.
  3. Wrap `HistoryDetailScreen` content in `<Screen>` (or `w-full max-w-content self-center`) for consistent tablet/web width constraints.

#### `src/app/(tabs)/history.tsx`, `src/app/history/index.tsx` & `src/app/(tabs)/monitoring.tsx`
- **Visual/Runtime Issue:**
  1. In `HistoryScreen` (`src/app/history/index.tsx`), each screening row is a plain unboxed vertical stack of 3 text lines (`created_at`, `riskStatus`/`normalStatus`, `duration_sec`) with no `Badge`, no status icon, and no trailing chevron (`›`), making it hard to scan risk vs. normal history entries at a glance.
  2. Neither `HistoryScreen` nor `MonitoringScreen` constrains content width with `max-w-content self-center`.
- **Design Directive:**
  1. In `HistoryScreen`, render each screening item as a `ListRow` (or `Card` row) with a leading status icon circle (`36x36px` `rounded-full`: `bg-risk-surface` with `warning` icon for `risk`, `bg-surface-safe` with `check` icon for `normal`), primary title `formatDate(item.created_at, true)` (`text-body font-semibold text-ink`), subtitle `formatDuration(item.duration_sec)` (`text-caption text-ink-muted`), trailing `<Badge variant={item.result} />`, and a trailing `chevronRight` icon.
  2. Constrain both `HistoryScreen` and `MonitoringScreen` inner content with `w-full max-w-content self-center`.

#### `src/app/doctors/index.tsx` & `src/app/doctors/[id].tsx`
- **Visual/Runtime Issue:**
  1. As seen in live runtime screenshot `final_step_203.png`, `DoctorsScreen` renders a redundant visible `<Text>{copy.care.searchDoctor}</Text>` label directly above a `<TextInput>` with the exact same placeholder `"Cari nama atau spesialisasi dokter"`, with no search icon and no clear button.
  2. Each doctor row stacks 4 text lines (`name`, `specialty`, `hospital_name`, `Penilaian 4,9`) next to a `64x64px` avatar with `"DI"`/`"DN"` initials and no trailing chevron, looking cramped and lacking interactive affordance.
  3. On `DoctorDetailScreen` (`src/app/doctors/[id].tsx`), the doctor's rating, bio, and schedule are rendered as loose uncontained text blocks directly on `bg-surface` rather than structured cards, and the `"Mulai Konsultasi"` CTA scrolls with content instead of staying pinned or separated at the bottom.
- **Design Directive:**
  1. On `DoctorsScreen`, remove the redundant `<Text>{copy.care.searchDoctor}</Text>` heading above the search bar; instead, build a search input container (`min-h-12 flex-row items-center gap-2 rounded-pill border border-border bg-surface-muted px-4 mb-4`) with a leading `<Icon name="search" tone="muted" />`, `flex-1` `TextInput`, and a conditional clear `Pressable` when `search.length > 0`.
  2. Structure each doctor row with `<Avatar size="md" />` (with `"Dr."` stripped from initials), `text-body font-semibold text-ink` for `item.name`, `text-label text-brand` for `item.specialty`, `text-caption text-ink-muted` combining `${item.hospital_name} · ★ ${item.rating.toLocaleString("id-ID", { minimumFractionDigits: 1 })}`, and a trailing `<Icon name="chevronRight" tone="muted" />`.
  3. On `DoctorDetailScreen`, group the doctor header (`Avatar size="xl"`, name, specialty, hospital, and rating `Badge`) in a `Card` (`variant="brand"`), wrap `"Tentang Dokter"` and `"Jadwal Praktik"` in `Card` (`variant="default"`) sections, and place `"Mulai Konsultasi"` in a sticky bottom bar (`border-t border-subtle bg-surface px-5 pt-3 pb-[insets.bottom + 12px]`).

#### `src/app/chats/index.tsx` & `src/app/chats/[id].tsx`
- **Visual/Runtime Issue:**
  1. In `ChatsListScreen` (`src/app/chats/index.tsx`), `item.unread_count` (present in `MOCK_CONVERSATIONS`) is completely ignored, and rows lack a right-aligned timestamp or trailing chevron.
  2. In `ChatRoomScreen` (`src/app/chats/[id].tsx`), the bottom composer stacks 3 full-width vertical elements (`<Text>Tulis pesan</Text>`, `<TextInput>`, and a full-width `<Button label="Kirim" />`), consuming ~165px of vertical screen real estate.
  3. In `ChatRoomScreen`, `"Telepon Dokter"` is placed inside the scrolling message list beneath the last message bubble instead of in the header, so it scrolls out of view or sits awkwardly under chat bubbles.
- **Design Directive:**
  1. In `ChatsListScreen`, render the timestamp (`formatDate(item.last_message.created_at)`) in the top-right of each row (`text-caption text-ink-muted`), and when `item.unread_count > 0`, render a `20x20px` circular unread badge (`min-w-5 h-5 rounded-full bg-brand items-center justify-center px-1.5` with `text-caption font-bold text-on-brand`).
  2. In `ChatRoomScreen`, move the `"Telepon Dokter"` action into `ScreenHeader`'s `rightAction` slot as a `44x44px` icon button (`accessibilityLabel={copy.chats.call}`, `<Icon name="phone" tone="brand" />`).
  3. Replace the 3-row stacked composer in `ChatRoomScreen` with a compact horizontal composer bar (`flex-row items-end gap-2 border-t border-subtle bg-surface px-4 pt-2.5 pb-[insets.bottom + 10px]`): a `flex-1 min-h-12 max-h-28 rounded-2xl border border-border bg-surface-muted px-4 py-2.5 text-body text-ink` `TextInput` (with `accessibilityLabel={copy.chats.input}` and placeholder `copy.chats.input`, removing the visible `"Tulis pesan"` label above it) beside a compact pill/circle send `Button` (`min-h-12 px-5 rounded-pill bg-brand`).

#### `src/app/hospitals/index.tsx` & `src/app/hospitals/map.tsx`
- **Visual/Runtime Issue:**
  1. In `HospitalsScreen`, when `isDefaultFallback` is `true`, the fallback notice (`"Lokasi Anda belum tersedia..."`) renders as plain uncontained text above two consecutive full-width `secondary` buttons (`"Periksa Lokasi"` and `"Peta Fasilitas Kesehatan"`), creating a wall of outlined buttons before the list starts.
  2. Hospital rows in `HospitalsScreen` omit the `has_pediatric` indicator (`Poli Anak`) available on `Hospital` domain objects and lack a trailing chevron or distance pill.
  3. In `HospitalMapScreen` (`src/app/hospitals/map.tsx`), there is no visual map or interactive preview, just a list of cards almost identical to `HospitalsScreen`, and when navigated with `?id=hosp-001` from `HospitalsScreen`, the selected hospital is sorted first without any visual highlight badge indicating it is the selected facility.
- **Design Directive:**
  1. In `HospitalsScreen`, wrap the `isDefaultFallback` notice and its `"Periksa Lokasi"` action inside a `Card` (`variant="soft"` / `warning`), and place `"Peta Fasilitas Kesehatan"` as a compact icon+text action in `ScreenHeader` or a single full-width button with `<Icon name="map" tone="brand" />`.
  2. In `HospitalsScreen` rows, wrap `<Icon name="hospital" tone="brand" />` in a `44x44px` `rounded-xl bg-surface-brand-soft` container, display a `Badge` (`variant="brand"`, label `"Poli Anak"`) when `item.has_pediatric` is `true`, and add a trailing `<Icon name="chevronRight" tone="muted" />`.
  3. In `HospitalMapScreen`, highlight the card matching the route param `id` using `Card variant="brand"` and a `"Fasilitas Terpilih"` badge, include the hospital's `type`, `distance_km`, and a secondary `"Telepon"` action (`tel:${item.phone}`) alongside `"Buka di Peta"`.

#### `src/app/articles/index.tsx` & `src/app/articles/[id].tsx`
- **Visual/Runtime Issue:**
  1. **Critical Content Bug (`/articles/[id]`):** `ArticleDetailScreen` renders `{article.body_md}` directly inside `<Text selectable className="text-body text-ink">`. In live testing of `/articles/art-001` through `art-006`, literal Markdown characters (`## Gejala Utama Pneumonia pada Anak`, `1. **Napas cepat atau sesak**`, `- **Vaksinasi lengkap**`) are displayed raw to the user.
  2. In `ArticlesScreen` (`src/app/articles/index.tsx`), the category filter pills (`Semua`, `Gejala`, `Pencegahan`, `Penanganan`, `Edukasi`) use `flex-row flex-wrap gap-2`, wrapping into 2 uneven rows across the screen and pushing the article list down by `120px`.
- **Design Directive:**
  1. In `ArticleDetailScreen` (`src/app/articles/[id].tsx`), parse `article.body_md` by splitting on double newlines (`\n\n`) and line prefixes: render `## ` blocks as `<Text accessibilityRole="header" className="text-subtitle font-bold text-ink mt-2">`, bullet/numbered list blocks (`- ` or `1. `) as structured rows with a bullet/number column and `flex-1` text, and parse inline `**bold**` segments into `<Text className="font-semibold text-ink">` spans so zero raw `##` or `**` syntax is ever shown to the user.
  2. In `ArticlesScreen`, replace the wrapping `flex-wrap` category container with a single-row horizontal `ScrollView` (`horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}`) and use `min-h-11 px-4 py-2 rounded-pill` chips.

#### `src/app/(tabs)/more.tsx` (Pengaturan & Tentang)
- **Visual/Runtime Issue:**
  1. Despite `copy.gallery.appearance` (`"Tampilan"`, `"Ikuti Perangkat"`, `"Terang"`, `"Gelap"`) existing in `src/constants/copy.ts`, `MoreScreen` provides no appearance/theme selector (`R-21`).
  2. `copy.more.privacy` (`"Kebijakan Privasi"`) and `copy.more.privacyBody` are defined in `src/constants/copy.ts` (and required by `antislop-ui` Demo Without a Product / `R-38`), but are never rendered on `MoreScreen`!
  3. `copy.more.appVersion` (`Versi 1.0.0`) is defined in `copy.ts` but omitted from the bottom of `MoreScreen`.
- **Design Directive:**
  1. Add a `"Tampilan"` section on `MoreScreen` using `<SegmentedTabs />` with options `[{ key: "system", label: copy.gallery.system }, { key: "light", label: copy.gallery.light }, { key: "dark", label: copy.gallery.dark }]` connected to the persisted theme preference hook.
  2. Render a `"Kebijakan Privasi"` section (`copy.more.privacy` heading + `copy.more.privacyBody` inside a `Card variant="soft"`) below `"Tentang PNEUMOTrack"`, and display `copy.more.appVersion("1.0.0")` (`text-caption text-ink-muted text-center`) below the `"Keluar"` button.

---

## 4. Hard-Coded Styles Inventory

The following files contain hard-coded numeric style values, inline magic measurements, raw character glyphs, or inconsistent dark-mode token pairings that must be migrated to semantic tokens (`src/constants/theme.ts` `UI` / `Spacing` tokens and `tailwind.config.js` utilities) by the execution agent:

- [x] [src/constants/theme.ts](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/constants/theme.ts#L60-L73): Expand `UI` with semantic icon sizes (`iconSm: 16`, `iconMd: 20`, `iconLg: 24`, `iconXl: 32`), avatar sizes (`avatarSm: 40`, `avatarMd: 48`, `avatarLg: 64`, `avatarXl: 80`), `analyzingLogoSize: 140`, and `maxFormWidth: 440`.
- [x] [src/constants/palette.json](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/constants/palette.json#L1-L42): Add `borderSubtle`, `warning`, `surfaceWarning`, `borderWarning`, and `scrim` tokens to both `light` and `dark` objects, and expose them in `tailwind.config.js`.
- [x] [src/components/ui/list-row.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/components/ui/list-row.tsx#L47): Replace hard-coded `<Text className="shrink-0 text-xl text-icon-muted">›</Text>` with `<Icon name="chevronRight" tone="muted" />` and replace `border-border` with `border-subtle`.
- [x] [src/components/ui/segmented-tabs.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/components/ui/segmented-tabs.tsx#L34): Remove hard-coded arbitrary `min-w-[120px]` class that forces segmented controls to wrap on narrow screens.
- [x] [src/components/ui/menu-sheet.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/components/ui/menu-sheet.tsx#L43-L52): Replace hard-coded `padding: 20`, `paddingBottom: insets.bottom + 24`, and `snapPoints={["full"]}` with `UI.gutter`, `Spacing.four`, and a medium snap point with a drag-handle indicator.
- [x] [src/components/ui/waveform.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/components/ui/waveform.tsx#L19-L21): Move hard-coded `BAR_COUNT = 32` and `BAR_HEIGHT = 72` into `UI` constants in `src/constants/theme.ts` and change the `"Belum ada sampel audio"` caption on line 165 from `text-ink` to `text-ink-muted`.
- [x] [src/components/screening/recording-guide.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/components/screening/recording-guide.tsx#L25-L39): Replace hard-coded `size={56}`, `width: 56, height: 56`, and `width: 56, height: 72` with `UI` diagram dimension tokens.
- [x] [src/app/screening/analyzing.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/screening/analyzing.tsx#L111): Replace hard-coded `style={{ width: 140, height: 140 }}` with `UI.analyzingLogoSize`.
- [x] [src/app/(tabs)/index.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/(tabs)/index.tsx#L51-L56): Replace hard-coded `paddingTop: insets.top + 12`, `paddingBottom: 24`, `paddingHorizontal: 20`, `gap: 24`, and `size={112}` (line 157) with `<Screen>` or `UI` spacing/gauge tokens.
- [x] [src/app/(tabs)/children.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/(tabs)/children.tsx#L83-L87): Replace hard-coded `paddingBottom: 24`, `paddingHorizontal: 20`, and `border-border/40` (line 147) with `<Screen>` layout and `border-subtle`.
- [x] [src/app/(tabs)/monitoring.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/(tabs)/monitoring.tsx#L33-L38): Replace hard-coded `paddingHorizontal: 20`, `paddingBottom: 24`, `gap: 16` with `<Screen>` container tokens.
- [x] [src/app/(tabs)/more.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/(tabs)/more.tsx#L86-L91): Replace hard-coded `paddingHorizontal: 20`, `paddingBottom: 24`, `gap: 20`, and `border-border/40` (line 117) with `<Screen>` and `border-subtle`.
- [x] [src/app/articles/index.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/articles/index.tsx#L51-L54): Replace hard-coded `paddingHorizontal: 20` and `paddingBottom: insets.bottom + 24` with `UI.gutter` and `Spacing.four`.
- [x] [src/app/articles/[id].tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/articles/%5Bid%5D.tsx#L29-L34): Replace raw `<ScrollView>` hard-coded `paddingHorizontal: 20`, `paddingBottom: insets.bottom + 24`, `gap: 16` with `<Screen>`.
- [x] [src/app/doctors/index.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/doctors/index.tsx#L39-L42): Replace hard-coded `paddingHorizontal: 20`, `paddingBottom: insets.bottom + 24`, and `border-border/40` (line 91) with `UI.gutter`, `Spacing.four`, and `border-subtle`.
- [x] [src/app/doctors/[id].tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/doctors/%5Bid%5D.tsx#L28-L33): Replace raw `<ScrollView>` hard-coded `paddingHorizontal: 20`, `paddingBottom: insets.bottom + 24`, `gap: 20` with `<Screen>`.
- [x] [src/app/chats/index.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/chats/index.tsx#L29): Replace hard-coded `paddingHorizontal: 20, paddingBottom: 24`, `paddingBottom: insets.bottom + 16` (line 92), and `border-border/40` (line 66) with `UI.gutter`, `Spacing`, and `border-subtle`.
- [x] [src/app/chats/[id].tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/chats/%5Bid%5D.tsx#L61-L65): Replace hard-coded `paddingHorizontal: 20`, `paddingBottom: 24`, `gap: 16`, `max-w-[90%]` (line 99, change to `max-w-[78%]`), and `paddingBottom: insets.bottom + 12` (line 129) with semantic spacing tokens.
- [x] [src/app/history/index.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/history/index.tsx#L32): Replace hard-coded `paddingHorizontal: 20, paddingBottom: 24` and `border-border/40` (line 86) with `UI.gutter`, `Spacing.four`, and `border-subtle`.
- [x] [src/app/history/[id].tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/history/%5Bid%5D.tsx#L32-L37): Replace raw `<ScrollView>` hard-coded `paddingBottom: insets.bottom + 24, paddingHorizontal: 20, gap: 16` with `<Screen>`.
- [x] [src/app/hospitals/index.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/hospitals/index.tsx#L27-L30): Replace hard-coded `paddingHorizontal: 20`, `paddingBottom: insets.bottom + 24`, and `border-border/40` (line 84) with `UI.gutter`, `Spacing.four`, and `border-subtle`.
- [x] [src/app/hospitals/map.tsx](file:///c:/Users/ASUS/Documents/Kuliah/Lomba/PNEUMOTrack/src/app/hospitals/map.tsx#L57-L61): Replace hard-coded `paddingHorizontal: 20`, `paddingBottom: insets.bottom + 24`, `gap: 16` with `UI.gutter` and `Spacing`.
