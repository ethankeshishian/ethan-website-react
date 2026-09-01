# CRA → Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `ethank.tech` from Create React App to Next.js (App Router, React 19) deployed on Vercel, with the site visually and behaviorally identical to production today.

**Architecture:** Two checkpoints. **Checkpoint A** (Tasks 1–8): the official Vercel codemod — Next wraps the existing `<App/>` (react-router intact) via an optional catch-all route, deployed as a client-rendered SPA that looks identical. **Checkpoint B** (Tasks 9–20): replace react-router with App Router file routes, add SSR-safe providers for Redux/MUI/antd, `next/font`, GA4, delete the CRA toolchain. The catch-all route and `<App/>` are deleted in Checkpoint B.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript 5, `@mui/material` v5 + Emotion, `antd` v5 + `@ant-design/nextjs-registry`, Redux + redux-persist, `@vercel/analytics`, `@next/third-parties` (GA4), `corner-smoothing`, `react-calendly`, FontAwesome 6.

**Spec:** `docs/superpowers/specs/2026-08-31-cra-to-nextjs-migration-design.md`

## Global Constraints

- **Visual/behavioral parity:** every task's verification is a side-by-side comparison with current production (`https://ethank.tech`). The site must look and behave identically. No redesign.
- **Next.js:** latest stable (16.x). **React / react-dom:** `^19`. **TypeScript:** `^5`.
- **No `output: 'export'`** in `next.config.ts` — deploying to Vercel, server features stay available.
- **No `/about` route** in this project (arrives with Project 2). `/` = the current homepage (About). Routes: `/`, `/schedule`, `/zoom`.
- **`imageLoaded` load gate ported exactly as-is** — the app container carries `notReadyToLoad` (`opacity: 0`) until the profile photo loads, then `app-fade`. Do not change this behavior.
- **Redux stays.** Do not migrate state management. `redux`, `react-redux`, `redux-persist`, `configureStore.tsx`, `reducers/*` unchanged except the provider wrapper.
- **antd stays** (v4 → v5). The theme toggle Switch must look exactly as today — pin via `ConfigProvider` component tokens; screenshot-verify.
- **Poppins loads all weights** (100–900) via `next/font/google` — no trimming.
- **Provider nesting order** (in `layout.tsx`, defined in spec §5c): `<Providers>` (Redux) → `<MuiProvider>` (Emotion + MUI theme) → `<AntdRegistry>` → `<AppShell>` → page `{children}`.
- **Commit after every task.** Branch: `cra-to-nextjs`.
- **Node 22** is the environment; Next 16 needs Node ≥ 20. The `NODE_OPTIONS=--openssl-legacy-provider` workaround is gone — do not carry it forward.
- The dev server runs on **port 3000** by default under Next (CRA also used 3000). Another project may occupy 3000; if so use `next dev -p 3001` and note it.

---

## File Structure

### Created

| File | Responsibility |
|---|---|
| `next.config.ts` | Next config — minimal, no static export |
| `src/app/layout.tsx` | Root layout (server): `<html>`/`<body>`, pre-paint theme script, `next/font`, global CSS import, `metadata`, analytics, provider tree |
| `src/app/globals.css` | Former `src/index.css` + `src/App.css` contents (fonts, resets, `.notReadyToLoad`/`.app-fade`) |
| `src/app/page.tsx` | `/` route (server) — renders `<About/>` |
| `src/app/schedule/page.tsx` | `/schedule` route (server) — renders `<ScheduleClient/>` |
| `src/app/zoom/route.ts` | `/zoom` — Route Handler, 307 redirect to `ZOOM` |
| `src/app/not-found.tsx` | 404 page |
| `src/app/[[...slug]]/page.tsx` | **Checkpoint A only** — catch-all, deleted in Task 9 |
| `src/app/[[...slug]]/client.tsx` | **Checkpoint A only** — `dynamic(() => import('../../App'), { ssr: false })`, deleted in Task 9 |
| `src/providers/Providers.tsx` | `'use client'` — Redux `<Provider>` + `<PersistGate>`, store via `useRef` |
| `src/providers/MuiProvider.tsx` | `'use client'` — Emotion cache via `useServerInsertedHTML` + `<ThemeProvider>` |
| `src/providers/AppShell.tsx` | `'use client'` — `imageLoaded` gate, `<Header>`, body wrapper (former `App.tsx` body) |
| `src/components/icons/MoonIcon.tsx` | Inline SVG component (former `assets/moon.svg`) |
| `src/components/icons/SunIcon.tsx` | Inline SVG component (former `assets/sun.svg`) |
| `src/app/icon.png` | Favicon (copied from `public/favicon-32x32.png`) — file-based metadata |
| `src/app/apple-icon.png` | Apple touch icon (copied from `public/apple-touch-icon.png`) |
| `src/app/opengraph-image.png` | OG image (copied from `public/ogImage.png`) |
| `.eslintrc.json` | `{ "extends": "next/core-web-vitals" }` |

### Moved

| From | To |
|---|---|
| `src/assets/fonts/*` | `public/fonts/*` |
| `src/assets/logos/*.jpeg` | `public/logos/*.jpeg` |

### Modified

| File | Change |
|---|---|
| `package.json` | scripts, deps (§9 of spec) |
| `tsconfig.json` | Next-extended (`jsx: preserve`, `moduleResolution: bundler`, plugin, includes) |
| `.gitignore` | `+ .next`, `next-env.d.ts`, `.vercel` |
| `src/index.css` | contents move to `globals.css`; file deleted |
| `src/constants.tsx` | remove `react-ga` import, `linkEvent`; keep link constants + `linkType`/`buttonType` only if still referenced (they are — by `SocialMediaIcons` handlers, which also get simplified) |
| `src/components/Header/Header.tsx` | `'use client'`; MUI v4→v5 imports; `makeStyles`→`sx`/`styled`; `useHistory`→`useRouter`; logo `<a>`→`<Link>` |
| `src/components/HeaderLinks/HeaderLinks.tsx` | `'use client'`; `NavLink`→`Link` + `usePathname` for active class |
| `src/components/ThemeButton/ThemeButton.tsx` | `'use client'`; antd v5 Switch; import icons from `components/icons/` |
| `src/components/ThemeButton/ThemeButton.css` | **deleted** (28k-line vendored antd v4 CSS); the 4 real rules move into the component |
| `src/components/About/About.tsx` | `'use client'`; static image import uses `.src`; keep `EDIT_IMAGE_LOADED` dispatch |
| `src/components/Resume/Resume.tsx` | `'use client'`; `require("../../assets/logos/"+x)` → `` `/logos/${x}` `` |
| `src/components/Schedule/Schedule.tsx` | rename export usage; wrapped by `ScheduleClient` (`dynamic ssr:false`) |
| `src/components/SquircleImage/SquircleImage.tsx` | `'use client'` (already client-ish); accept `src` as string (from `photo.src`) |
| `src/components/Squircle/Squircle.tsx` | `'use client'` |
| `src/components/SocialMediaIcons/SocialMediaIcons.tsx` | remove `linkEvent`/`buttonType` usage; `handleClick`/`middleMouseHandler` become no-ops or removed |

### Deleted

`src/App.tsx`, `src/App.css`, `src/index.tsx`, `src/index.css`, `src/serviceWorker.ts`, `src/App.test.tsx`, `src/setupTests.ts`, `src/react-app-env.d.ts`, `src/components/Body/` (whole dir), `src/components/ScrollToTop.tsx`, `src/components/Footer/` (whole dir), `src/components/SocialMediaLinks/` (whole dir), `src/components/Articles/` (whole dir), `src/components/ThemeButton/ThemeButton.css`, `src/assets/moon.svg`, `src/assets/sun.svg`, `public/index.html`. At cutover (Task 20): `firebase.json`, `.firebaserc`, `.firebase/`.

---

# CHECKPOINT A — Next.js SPA, identical UX

Goal: after Task 8, `next dev` and `next build` both work, and the site is a client-rendered SPA that is pixel-indistinguishable from current production, deployed to a Vercel preview.

---

### Task 1: Branch and install Next.js + React 19

**Files:**
- Modify: `package.json`
- Create: `next.config.ts`

**Interfaces:**
- Produces: `next` on PATH via `npx`/scripts; React 19 in `node_modules`.

- [ ] **Step 1: Create the branch**

```bash
git checkout master
git pull
git checkout -b cra-to-nextjs
```

- [ ] **Step 2: Install Next.js, React 19, TypeScript 5**

```bash
npm install next@latest react@^19 react-dom@^19
npm install -D typescript@^5 @types/react@^19 @types/react-dom@^19 @types/node@latest eslint eslint-config-next@latest
```

Expected: installs succeed. Peer warnings from old deps (`@material-ui`, `antd`, `react-calendly`) are expected at this stage — they are replaced/verified later. If `npm install` errors hard (not just warns), add `--legacy-peer-deps` and note it.

- [ ] **Step 3: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No `output: "export"` — deploying to Vercel; keep server features available.
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Verify Next binary resolves**

Run: `npx next --version`
Expected: prints a `16.x` version.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "chore: install next, react 19, typescript 5"
```

---

### Task 2: Root layout + globals.css

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Modify: `tsconfig.json`, `.gitignore`
- Reference: `public/index.html`, `src/index.css`, `src/App.css`

**Interfaces:**
- Produces: `RootLayout` default export wrapping `{children}` in `<html><body>`; `metadata` export; global CSS loaded once.

- [ ] **Step 1: Build `globals.css` from the three CRA CSS files**

Create `src/app/globals.css` by concatenating, in this order:
1. The full contents of `src/index.css` (all `@font-face` blocks + `body`/`code`/`h1`–`h6` rules + the `::selection` overrides).
2. The full contents of `src/App.css` (`.app-fade`, `@keyframes appfade`, `.notReadyToLoad`, `.App`, `.header`, `.body`, `.footer`, `:focus`).

Then update every `@font-face` `src: url(...)` path: change `url("assets/fonts/X")` → `url("/fonts/X")`.

Do NOT import `src/constants.css` here — it is imported by components already and stays where it is (or is imported in `layout.tsx` explicitly in a later step; for now leave the existing component imports of it intact).

- [ ] **Step 2: Move the font files**

```bash
mkdir -p public/fonts
git mv src/assets/fonts/* public/fonts/
```

- [ ] **Step 3: Create `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import "../constants.css";

export const metadata: Metadata = {
  title: "Ethan Keshishian",
  description: "Ethan Keshishian",
  openGraph: {
    images: ["/ogImage.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Note: the Poppins + Material Icons `<link>` tags are kept here for Checkpoint A (parity with `public/index.html`). They are replaced by `next/font` / removed in Checkpoint B (Task 13).

- [ ] **Step 4: Update `tsconfig.json`**

Replace the file with:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "src"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Update `.gitignore`**

Append:

```
# next.js
/.next/
/out/
next-env.d.ts
.vercel
```

- [ ] **Step 6: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: no errors from `layout.tsx` / `tsconfig`. (Errors from `src/App.tsx` and friends still using old patterns are acceptable at this step — they're fixed in Task 4–7. If tsc is too noisy, note which files error and move on.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: next.js root layout, globals.css, move fonts to public"
```

---

### Task 3: Catch-all route + client-only App wrapper

**Files:**
- Create: `src/app/[[...slug]]/page.tsx`
- Create: `src/app/[[...slug]]/client.tsx`

**Interfaces:**
- Consumes: `src/App.tsx` default export (unchanged CRA `<App/>`).
- Produces: every route renders `<App/>` client-side; `generateStaticParams` returns the root slug.

- [ ] **Step 1: Create `src/app/[[...slug]]/client.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";

const App = dynamic(() => import("../../App"), { ssr: false });

export function ClientOnly() {
  return <App />;
}
```

- [ ] **Step 2: Create `src/app/[[...slug]]/page.tsx`**

```tsx
import { ClientOnly } from "./client";

export function generateStaticParams() {
  return [{ slug: [""] }];
}

export default function Page() {
  return <ClientOnly />;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\[\[...slug\]\]
git commit -m "feat: catch-all route rendering CRA App client-side"
```

---

### Task 4: Fix the module-level breakers so the app can load

**Files:**
- Modify: `src/constants.tsx`
- Modify: `src/components/SocialMediaIcons/SocialMediaIcons.tsx`
- Delete: `src/index.tsx`, `src/serviceWorker.ts`, `src/App.test.tsx`, `src/setupTests.ts`, `src/react-app-env.d.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `src/App.tsx` default export with no `ReactDOM.render`, no `react-ga`. `constants.tsx` exports the link URL constants + `linkType` + `buttonType`, no `linkEvent`, no `react-ga`.

- [ ] **Step 1: Delete CRA entry + test files**

```bash
git rm src/index.tsx src/serviceWorker.ts src/App.test.tsx src/setupTests.ts src/react-app-env.d.ts
```

- [ ] **Step 2: Strip `react-ga` from `src/constants.tsx`**

Remove line 1 (`import ReactGA from "react-ga";`) and the entire `linkEvent` function (lines ~26–34). Keep everything else (the `*_LINK` constants, `buttonType`, `linkType`, `CALENDLY`, `ZOOM`).

Result file:

```tsx
export const LINKEDIN_LINK = "https://linkedin.com/in/ethankeshishian";
export const GITHUB_LINK = "https://github.com/ethankeshishian";
export const TWITTER_LINK = "https://x.com/ethankeshishian";
export const INSTAGRAM_LINK = "https://instagram.com/ethankeshishian";
export const SPOTIFY_LINK = "https://open.spotify.com/user/baklou";
export const EMAIL_LINK = "mailto:ethan@ethank.tech";

export const UNICORNER_LINK = "https://unicorner.news";
export const SPOTCLUB_LINK = "https://spotclub.live";

export enum buttonType {
  Round = "round",
  Footer = "footer",
}
export enum linkType {
  Linkedin = "LinkedIn",
  Github = "GitHub",
  Twitter = "Twitter",
  Instagram = "Instagram",
  Spotify = "Spotify",
  Email = "Email",
}

export const CALENDLY = "https://calendly.com/ethan_k/30min";
export const ZOOM = "https://mercury.zoom.us/j/7298178714?pwd=IoAS3aOgcQuLvoEdVL4mVINyn4bPqo.1";
```

- [ ] **Step 3: Fix `SocialMediaIcons.tsx` — remove `linkEvent`/`buttonType` usage**

In `src/components/SocialMediaIcons/SocialMediaIcons.tsx`:
- Change the import to drop `buttonType`, `linkType`, `linkEvent`:

```tsx
import {
  LINKEDIN_LINK,
  GITHUB_LINK,
  INSTAGRAM_LINK,
  TWITTER_LINK,
  SPOTIFY_LINK,
  EMAIL_LINK,
} from '../../constants';
```

- Delete the `handleClick` function and the `middleMouseHandler` function.
- Remove every `onClick={() => handleClick(...)}` and `onMouseDown={(event) => middleMouseHandler(...)}` prop from the six `<a>` elements. Each anchor keeps only `href` and `className="social-icon-link"`.

- [ ] **Step 4: Fix `src/App.tsx` — remove `react-ga`, keep it as a pure component**

`src/App.tsx` currently calls `ReactGA.initialize(...)` and `ReactGA.pageview(...)` at the top of the component body. Remove:
- `import ReactGA from "react-ga";`
- the `const trackingID` line, `ReactGA.initialize(trackingID);`, `ReactGA.pageview("/homepage");`

Keep the rest of `App.tsx` exactly as-is (the `<Router>`, `ScrollToTop`, header/body divs, the `imageLoaded` selector + class logic). It still imports `./App.css` and `./constants.css` — leave those.

- [ ] **Step 5: Uninstall `react-ga`**

```bash
npm uninstall react-ga
```

- [ ] **Step 6: Verify tsc**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `react-ga`, `linkEvent`, `ReactDOM`. Errors about `react-router-dom` types or MUI are still acceptable here.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove react-ga/UA analytics and CRA entry files"
```

---

### Task 5: Fix dynamic `require()` image imports

**Files:**
- Modify: `src/components/Resume/Resume.tsx`
- Move: `src/assets/logos/*` → `public/logos/*`

**Interfaces:**
- Produces: `Resume.tsx` renders logo `<img>` from `/logos/<filename>` paths.

- [ ] **Step 1: Move the logo files**

```bash
mkdir -p public/logos
git mv src/assets/logos/*.jpeg public/logos/
```

- [ ] **Step 2: Replace the three `require(...)` calls in `src/components/Resume/Resume.tsx`**

There are three identical patterns (lines ~20, ~40, ~73):

```tsx
src={require("../../assets/logos/" + item.logo).default}
```

Replace each with:

```tsx
src={`/logos/${item.logo}`}
```

Leave the `alt={item.logo}` and `className` on each `<img>` unchanged.

- [ ] **Step 3: Verify tsc**

Run: `npx tsc --noEmit`
Expected: no errors about `require` or the logos path in `Resume.tsx`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: logos load from public/ instead of webpack require"
```

---

### Task 6: Fix SVG imports (theme icons)

**Files:**
- Create: `src/components/icons/MoonIcon.tsx`
- Create: `src/components/icons/SunIcon.tsx`
- Modify: `src/components/ThemeButton/ThemeButton.tsx`
- Delete: `src/assets/moon.svg`, `src/assets/sun.svg`

**Interfaces:**
- Produces: `MoonIcon`, `SunIcon` — React components accepting `className?: string`, rendering the exact SVG paths from the former asset files.

- [ ] **Step 1: Create `src/components/icons/MoonIcon.tsx`**

```tsx
export function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 11.807C10.7418 10.5483 9.88488 8.94484 9.53762 7.1993C9.19037 5.45375 9.36832 3.64444 10.049 2C8.10826 2.38205 6.3256 3.33431 4.92899 4.735C1.02399 8.64 1.02399 14.972 4.92899 18.877C8.83499 22.783 15.166 22.782 19.072 18.877C20.4723 17.4805 21.4245 15.6983 21.807 13.758C20.1625 14.4385 18.3533 14.6164 16.6077 14.2692C14.8622 13.9219 13.2588 13.0651 12 11.807V11.807Z" />
    </svg>
  );
}
```

- [ ] **Step 2: Create `src/components/icons/SunIcon.tsx`**

```tsx
export function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M6.995 12C6.995 14.761 9.241 17.007 12.002 17.007C14.763 17.007 17.009 14.761 17.009 12C17.009 9.239 14.763 6.993 12.002 6.993C9.241 6.993 6.995 9.239 6.995 12ZM11 19H13V22H11V19ZM11 2H13V5H11V2ZM2 11H5V13H2V11ZM19 11H22V13H19V11Z" />
      <path d="M5.63702 19.778L4.22302 18.364L6.34402 16.243L7.75802 17.657L5.63702 19.778Z" />
      <path d="M16.242 6.34405L18.364 4.22205L19.778 5.63605L17.656 7.75805L16.242 6.34405Z" />
      <path d="M6.34402 7.75902L4.22302 5.63702L5.63802 4.22302L7.75802 6.34502L6.34402 7.75902Z" />
      <path d="M19.778 18.3639L18.364 19.7779L16.242 17.6559L17.656 16.2419L19.778 18.3639Z" />
    </svg>
  );
}
```

- [ ] **Step 3: Update `src/components/ThemeButton/ThemeButton.tsx` imports**

Change:

```tsx
import { ReactComponent as MoonIcon } from "../../assets/moon.svg";
import { ReactComponent as SunIcon } from "../../assets/sun.svg";
```

to:

```tsx
import { MoonIcon } from "../icons/MoonIcon";
import { SunIcon } from "../icons/SunIcon";
```

The JSX usage (`<MoonIcon className="theme-svg" />`, `<SunIcon className="theme-svg" />`) is unchanged — the new components accept `className`.

- [ ] **Step 4: Delete the SVG files**

```bash
git rm src/assets/moon.svg src/assets/sun.svg
```

- [ ] **Step 5: Verify tsc**

Run: `npx tsc --noEmit`
Expected: no errors about `.svg` imports or `ReactComponent`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: theme icons as inline SVG components"
```

---

### Task 7: Update package.json scripts, remove react-scripts, first `next dev`

**Files:**
- Modify: `package.json`
- Delete: `public/index.html`

**Interfaces:**
- Produces: `npm run dev` / `npm run build` run Next.

- [ ] **Step 1: Update `package.json` scripts**

Replace the `scripts` block with:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

- [ ] **Step 2: Uninstall CRA tooling**

```bash
npm uninstall react-scripts react-app-rewired @types/styled-jsx @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

- [ ] **Step 3: Delete `public/index.html`**

```bash
git rm public/index.html
```

- [ ] **Step 4: Create `.eslintrc.json`**

```json
{
  "extends": "next/core-web-vitals"
}
```

- [ ] **Step 5: Run `next dev`**

Run: `npm run dev` (background it or use a second terminal). If port 3000 is taken, run `npx next dev -p 3001` and use 3001 everywhere below.

Wait for "Ready" / "compiled". Open `http://localhost:3000`.

Expected: the site renders. It is still the CRA app inside a client-only wrapper. There may be a brief blank flash before hydration (the `notReadyToLoad` gate + client-only dynamic import) — acceptable for Checkpoint A. `react-router` handles `/` and `/schedule` client-side.

- [ ] **Step 6: Run `next build`**

Run: `npm run build`
Expected: build completes. Warnings about `react-router-dom`, MUI v4, antd v4 peer deps or `'use client'` boundaries may appear — note them, they're resolved in Checkpoint B. **A hard build failure is a blocker** — stop and diagnose.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: next scripts, remove react-scripts and test tooling"
```

---

### Task 8: Checkpoint A verification + Vercel preview

**Files:** none (verification + deploy)

- [ ] **Step 1: Start `next dev` and the current production site side by side**

Open `http://localhost:3000` and `https://ethank.tech` in two windows at the same size.

- [ ] **Step 2: Compare — homepage, light mode**

Check: hero bio card (photo, "Hi, I'm Ethan.", tagline, bio with Unicorner link, social icons in order LinkedIn/X/GitHub/Email/Instagram/Spotify), squircle corners on photo + card, gradient background animation, header (E.H.K. logo, About/Schedule links, theme toggle), Education/Experience resume card, PROJECTS blurred heading, project cards.

Expected: visually identical.

- [ ] **Step 3: Compare — homepage, dark mode**

Toggle the theme. Reload the page — the dark mode must persist (redux-persist). Compare the same elements. Note: there may be a **white flash on reload in dark mode** at this checkpoint (the pre-paint script comes in Checkpoint B, Task 11) — record it as a known gap, not a blocker.

- [ ] **Step 4: Compare — `/schedule`**

Navigate via the header link and by direct URL (`http://localhost:3000/schedule`). The Calendly widget loads. Compare layout.

- [ ] **Step 5: Compare — `/zoom`**

Navigate to `http://localhost:3000/zoom`. Expected: redirects to the Mercury Zoom URL (via `window.location.replace` inside the CRA `Body.tsx` — still the old mechanism at this checkpoint).

- [ ] **Step 6: Compare — mobile drawer**

Resize to < 800px. The hamburger appears. Open it — MUI Drawer slides in with E.H.K., About, Schedule, theme toggle. Compare to prod.

- [ ] **Step 7: Push the branch and create a Vercel preview**

```bash
git push -u origin cra-to-nextjs
```

**User action:** Import the repo at vercel.com (Next.js auto-detected). The `cra-to-nextjs` branch gets a preview URL. Open it and repeat Steps 2–6 against the deployed preview.

Expected: the Vercel preview matches production. Any difference that isn't a recorded known-gap (dark-mode flash, `/zoom` mechanism) is a blocker for Checkpoint A.

- [ ] **Step 8: Record results**

Append a short "Checkpoint A results" note to the bottom of this plan file (what matched, the known gaps). Commit it.

```bash
git add docs/superpowers/plans/2026-08-31-cra-to-nextjs-migration.md
git commit -m "docs: checkpoint A verification results"
```

---

# CHECKPOINT B — Real Next.js (App Router, SSR-safe providers)

Goal: `react-router` gone, file routes, SSR-safe Redux/MUI/antd, `next/font`, GA4, dark-mode pre-paint. This is what gets merged.

---

### Task 9: Providers — Redux wrapper, delete catch-all + App

**Files:**
- Create: `src/providers/Providers.tsx`
- Create: `src/providers/AppShell.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Delete: `src/app/[[...slug]]/` (whole dir), `src/App.tsx`, `src/App.css`, `src/components/Body/` (whole dir), `src/components/ScrollToTop.tsx`

**Interfaces:**
- Consumes: `configureStore` from `src/redux/configureStore` (returns `{ store, persistor }`); `About` default export from `src/components/About`.
- Produces:
  - `Providers` — `'use client'` default export, props `{ children: React.ReactNode }`, wraps children in Redux `<Provider>` + `<PersistGate>`.
  - `AppShell` — `'use client'` default export, props `{ children: React.ReactNode }`, reads `state.readyToLoad.imageLoaded`, renders `<div className={imageLoaded ? "App app-fade" : "App notReadyToLoad"}>` containing a fixed `.header` div with `<Header/>` and a `.body` div with `{children}`.

- [ ] **Step 1: Create `src/providers/Providers.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import configureStore from "../redux/configureStore";

export default function Providers({ children }: { children: React.ReactNode }) {
  const ref = useRef<ReturnType<typeof configureStore>>();
  if (!ref.current) {
    ref.current = configureStore();
  }
  const { store, persistor } = ref.current;

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
```

- [ ] **Step 2: Create `src/providers/AppShell.tsx`**

Port the body of the current `src/App.tsx` (the `<div className={...}>` with `.header` and `.body` divs). It does NOT include `<Router>` or `<ScrollToTop>` (App Router handles both).

```tsx
"use client";

import { useSelector } from "react-redux";
import { RootState } from "../redux/reducers";
import Header from "../components/Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const imageLoaded = useSelector(
    (state: RootState) => state.readyToLoad.imageLoaded
  );

  return (
    <div className={imageLoaded ? "App app-fade" : "App notReadyToLoad"}>
      <div className="header">
        <Header />
      </div>
      <div className="body">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/page.tsx`**

```tsx
import About from "../components/About";

export default function Page() {
  return <About />;
}
```

- [ ] **Step 4: Update `src/app/layout.tsx` to use the providers**

Change the `<body>` line from `<body>{children}</body>` to:

```tsx
<body>
  <Providers>
    <AppShell>{children}</AppShell>
  </Providers>
</body>
```

Add imports at the top:

```tsx
import Providers from "../providers/Providers";
import AppShell from "../providers/AppShell";
```

(MuiProvider + AntdRegistry are inserted in Tasks 15 and 16.)

- [ ] **Step 5: Delete the catch-all and CRA App**

```bash
git rm -r "src/app/[[...slug]]"
git rm src/App.tsx src/App.css
git rm -r src/components/Body src/components/ScrollToTop.tsx
```

Note: `src/App.css`'s content is already in `globals.css` from Task 2.

- [ ] **Step 6: Add `'use client'` to components that need it**

Add `"use client";` as the first line of each:
- `src/components/About/About.tsx`
- `src/components/Resume/Resume.tsx`
- `src/components/Squircle/Squircle.tsx`
- `src/components/SquircleImage/SquircleImage.tsx`
- `src/components/SocialMediaIcons/SocialMediaIcons.tsx`
- `src/components/HeaderLinks/HeaderLinks.tsx`
- `src/components/ThemeButton/ThemeButton.tsx`
- `src/components/Header/Header.tsx`

(These use hooks / Redux / `ResizeObserver` / browser APIs. `Squircle`/`SquircleImage` wrap `corner-smoothing` which uses `ResizeObserver`.)

- [ ] **Step 7: Run `next dev`, load `/`**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: homepage renders via `app/page.tsx` → `<About/>`. `/schedule` will 404 for now (its route comes in Task 10). Console: no "useSelector outside Provider" errors. There may be MUI/antd SSR warnings (fixed in 15/16).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: Redux provider + AppShell, delete catch-all and CRA App"
```

---

### Task 10: File routes for /schedule and /zoom

**Files:**
- Create: `src/app/schedule/page.tsx`
- Create: `src/components/Schedule/ScheduleClient.tsx`
- Create: `src/app/zoom/route.ts`
- Create: `src/app/not-found.tsx`
- Modify: `src/components/Schedule/Schedule.tsx`

**Interfaces:**
- Consumes: `Schedule` default export from `src/components/Schedule/Schedule`; `ZOOM` from `src/constants`.
- Produces: `/schedule` route; `/zoom` 307 redirect; 404 page.

- [ ] **Step 1: Add `'use client'` to `Schedule.tsx`**

Add `"use client";` as the first line of `src/components/Schedule/Schedule.tsx`. It uses `useDispatch` and `react-calendly`. Keep its `useEffect` dispatch of `EDIT_IMAGE_LOADED` exactly as-is.

- [ ] **Step 2: Create `src/components/Schedule/ScheduleClient.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";

const Schedule = dynamic(() => import("./Schedule"), { ssr: false });

export default function ScheduleClient() {
  return <Schedule />;
}
```

- [ ] **Step 3: Create `src/app/schedule/page.tsx`**

```tsx
import ScheduleClient from "../../components/Schedule/ScheduleClient";

export default function Page() {
  return <ScheduleClient />;
}
```

- [ ] **Step 4: Create `src/app/zoom/route.ts`**

```ts
import { redirect } from "next/navigation";
import { ZOOM } from "../../constants";

export function GET() {
  redirect(ZOOM);
}
```

Note: `redirect()` from `next/navigation` issues a 307. (If linting complains that `redirect` in a route handler should be `NextResponse.redirect`, use `import { NextResponse } from "next/server"; export function GET() { return NextResponse.redirect(ZOOM, 307); }` instead.)

- [ ] **Step 5: Create `src/app/not-found.tsx`**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "160px 24px", textAlign: "center" }}>
      <h2 style={{ color: "var(--large-heading-color)" }}>Page not found</h2>
      <Link href="/" style={{ color: "var(--accent-color)" }}>
        Go home
      </Link>
    </div>
  );
}
```

- [ ] **Step 6: Verify routes**

Run: `npm run dev`.
- `http://localhost:3000/schedule` → Calendly widget renders.
- `http://localhost:3000/zoom` → redirects to the Mercury Zoom URL.
- `http://localhost:3000/nonsense` → the not-found page.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: /schedule, /zoom, 404 as app router routes"
```

---

### Task 11: Dark-mode pre-paint script

**Files:**
- Modify: `src/app/layout.tsx`
- Reference: `src/redux/configureStore.tsx` (persist key), `src/components/ThemeButton/ThemeButton.tsx`

**Interfaces:**
- Produces: `<body>` has class `dark-mode` before first paint when the persisted theme is dark.

- [ ] **Step 1: Determine the exact persisted shape**

Run `npm run dev`, open the site, toggle to dark mode, then in the browser console:

```js
JSON.parse(localStorage.getItem("persist:root"))
```

Confirm it looks like `{ colorTheme: "{\"darkMode\":true,\"_persist\":{...}}", _persist: "..." }` — `colorTheme` is a **JSON string**. Record the actual shape here in the plan file.

- [ ] **Step 2: Add the inline script to `layout.tsx` `<head>`**

Inside `<head>`, before the font links:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
try {
  var raw = localStorage.getItem('persist:root');
  if (raw) {
    var root = JSON.parse(raw);
    var theme = JSON.parse(root.colorTheme || '{}');
    if (theme && theme.darkMode) {
      document.body.classList.add('dark-mode');
    }
  }
} catch (e) {}
`,
  }}
/>
```

Note: `document.body` is available because Next renders `<head>` and `<body>` in the same document and this script runs synchronously during parse, after `<body>` opens — verify. If `document.body` is null at that point, switch to `document.documentElement` and add a matching `:root.dark-mode` CSS alias, OR move the script to the very top of `<body>`.

- [ ] **Step 3: Verify — no flash**

Run `npm run dev`. Set dark mode. **Hard reload** (Cmd+Shift+R). Watch the top-left of the page as it loads.
Expected: no white flash — the page is dark from the first frame.
Then toggle to light, hard reload — no dark flash.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx docs/superpowers/plans/2026-08-31-cra-to-nextjs-migration.md
git commit -m "feat: pre-paint dark mode script, no theme flash on load"
```

---

### Task 12: Static image import for the profile photo

**Files:**
- Modify: `src/components/About/About.tsx`
- Modify: `src/components/SquircleImage/SquircleImage.tsx`

**Interfaces:**
- Consumes: `Ethan4.jpg` static import (Next returns `{ src, height, width, blurDataURL }`).
- Produces: `SquircleImage` receives `src` as a string.

- [ ] **Step 1: Check how `About.tsx` imports the photo**

Current: `import Ethan from "../../assets/Ethan4.jpg";` then `<SquircleImage src={Ethan} ... />`.

In Next, `Ethan` is now an object, not a string. `SquircleImage` builds a CSS `url(${src})` and calls `new Image(); img.src = src`.

- [ ] **Step 2: Update `About.tsx`**

Change the `<SquircleImage>` usage to pass the string:

```tsx
<SquircleImage
  src={Ethan.src}
  alt="Ethan Keshishian"
  onLoad={() =>
    dispatch({ type: "EDIT_IMAGE_LOADED", payload: true })
  }
/>
```

(Add `.src` to the `src` prop. Everything else unchanged.)

- [ ] **Step 3: Confirm `SquircleImage.tsx` handles a string**

It already treats `src` as a string in `` `url(${src})` `` and `img.src = src`. No change needed unless TypeScript complains about the `any` prop — if `src` is typed, keep it `string`.

- [ ] **Step 4: Verify**

Run `npm run dev`, load `/`. The profile photo appears (squircle-clipped, drop shadow). The `notReadyToLoad` → `app-fade` transition still fires when it loads.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: profile photo uses next static import .src"
```

---

### Task 13: next/font for Poppins, drop the Google Fonts links

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (remove any `font-family` on `body` that conflicts)

**Interfaces:**
- Produces: Poppins loaded via `next/font/google`, applied to `<body>`.

- [ ] **Step 1: Add the `next/font` import to `layout.tsx`**

At the top:

```tsx
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-poppins",
});
```

- [ ] **Step 2: Apply it to `<body>`**

```tsx
<body className={poppins.className}>
```

(Combine with any existing className via a template literal if the pre-paint script approach added one.)

- [ ] **Step 3: Remove the Poppins + Material Icons `<link>` tags from `<head>`**

Delete the three `<link>` elements added in Task 2 Step 3 for Poppins, plus the `preconnect` pair, plus the Material Icons `<link>`. (Material Icons is replaced by `@mui/icons-material` in Task 14. If Task 14 is not done yet, keep the Material Icons `<link>` for now and remove it in Task 14.)

- [ ] **Step 4: Reconcile `globals.css`**

`src/index.css` (now in `globals.css`) sets `body { font-family: "Poppins", sans-serif; }`. Keep that rule — `next/font`'s Poppins registers under the family name `Poppins` too, but to be safe change it to use the CSS variable: `body { font-family: var(--font-poppins), "Poppins", sans-serif; }`.

- [ ] **Step 5: Verify fonts**

Run `npm run dev`. Compare the homepage headings and body text to production. "Hi, I'm Ethan." (Poppins 900), the tagline (500), bio (300), header links (500). No layout shift on load, no FOUT.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: self-host Poppins via next/font, drop google fonts links"
```

---

### Task 14: MUI v4 → v5 — packages, Header imports, makeStyles rewrite

**Files:**
- Modify: `package.json`
- Modify: `src/components/Header/Header.tsx`
- Modify: `src/app/layout.tsx` (remove Material Icons `<link>` if still present)

**Interfaces:**
- Produces: `Header` renders with MUI v5 components; `makeStyles` replaced by `sx`/`styled`.

- [ ] **Step 1: Swap the packages**

```bash
npm uninstall @material-ui/core @material-ui/icons material-ui
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled @emotion/cache
```

- [ ] **Step 2: Rewrite `Header.tsx` imports**

| Old | New |
|---|---|
| `import Divider from "@material-ui/core/Divider";` | `import Divider from "@mui/material/Divider";` |
| `import Drawer from "@material-ui/core/Drawer";` | `import Drawer from "@mui/material/Drawer";` |
| `import Hidden from "@material-ui/core/Hidden";` | **removed** — `Hidden` is deprecated in v5; replace its usage (see Step 4) |
| `import IconButton from "@material-ui/core/IconButton";` | `import IconButton from "@mui/material/IconButton";` |
| `import InfoIcon from "@material-ui/icons/Info";` | `import InfoIcon from "@mui/icons-material/Info";` |
| `import List from "@material-ui/core/List";` | `import List from "@mui/material/List";` |
| `import ListItem from "@material-ui/core/ListItem";` | `import ListItem from "@mui/material/ListItem";` |
| `import ListItemIcon from "@material-ui/core/ListItemIcon";` | `import ListItemIcon from "@mui/material/ListItemIcon";` |
| `import ListItemText from "@material-ui/core/ListItemText";` | `import ListItemText from "@mui/material/ListItemText";` |
| `import CalendarTodayIcon from "@material-ui/icons/CalendarToday";` | `import CalendarTodayIcon from "@mui/icons-material/CalendarToday";` |
| `import MenuIcon from "@material-ui/icons/Menu";` | `import MenuIcon from "@mui/icons-material/Menu";` |
| `import { makeStyles, useTheme } from "@material-ui/core/styles";` | `import { useTheme, styled } from "@mui/material/styles";` |

Also remove `import { useHistory } from "react-router-dom";` and `import { fa500px } from "@fortawesome/free-brands-svg-icons";` (the latter is unused — the lint warning goes away).

- [ ] **Step 3: Replace `useHistory` with `useRouter`**

Add `import { useRouter } from "next/navigation";` and `import Link from "next/link";`.

Change `const history = useHistory();` → `const router = useRouter();`.

In `handleDrawerButtonClick`:

```tsx
const handleDrawerButtonClick = (index: number) => {
  handleDrawerToggle();
  const link = index % 2 === 0 ? "/" : "/schedule";
  router.push(link);
};
```

Change the two `<a href="/" className="...">` (logo, one in `drawer`, one in the main return) to `<Link href="/" className="...">`.

- [ ] **Step 4: Rewrite the `makeStyles`/`useStyles` block as `styled` + `sx`**

The current `useStyles` (lines ~104–158) defines: `drawer`, `menuButton`, `toolbar`, `drawerPaper`, `drawerHeader`, `listButton`, `listText`, `divider`, `themeButtonContainer`.

Delete the entire `const useStyles = makeStyles(...)` block and `const classes = useStyles();`.

Replace with `styled` components / `sx` props at each use site. Concrete mapping (keep every value identical):

```tsx
// breakpoint const stays
const drawerWidth = 240;
const breakpoint = 800;

// menu button — was classes.menuButton
<IconButton
  color="inherit"
  aria-label="open drawer"
  onClick={handleDrawerToggle}
  sx={{
    display: { xs: "flex", [`@media (min-width:${breakpoint}px)`]: "none" },
    color: "var(--large-heading-color)",
    height: "22px",
    width: "22px",
  }}
>
```

Actually use MUI's breakpoint helper cleanly:

```tsx
sx={(theme) => ({
  [theme.breakpoints.up(breakpoint)]: { display: "none" },
  color: "var(--large-heading-color)",
  height: "22px",
  width: "22px",
})}
```

```tsx
// Drawer paper — was classes.drawerPaper
<Drawer
  ...
  slotProps={{ paper: { sx: { width: drawerWidth, backgroundColor: "var(--background-overlay)" } } }}
>
```

(In MUI v5.14+ use `slotProps.paper`; older v5 uses `PaperProps={{ sx: {...} }}`. Use whichever the installed version supports — check `npm ls @mui/material`.)

```tsx
// drawerHeader wrapper div
<Box
  sx={(theme) => ({
    display: "flex",
    alignItems: "center",
    px: 2,
    ...theme.mixins.toolbar,
    justifyContent: "flex-start",
    height: "var(--header-height)",
  })}
>
```

(Add `import Box from "@mui/material/Box";`.)

```tsx
// ListItemIcon — was classes.listButton
<ListItemIcon sx={{ color: "var(--large-heading-color)" }}>

// ListItemText — was classes.listText
<ListItemText primary={text} sx={{ color: "var(--large-heading-color)" }} />

// Divider — was classes.divider
<Divider sx={{ backgroundColor: "var(--divider-color)" }} />

// theme button container — was classes.themeButtonContainer
<Box
  sx={{
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    position: "fixed",
    bottom: 0,
    width: drawerWidth,
    pb: "16px",
  }}
>
```

The `classes.toolbar` was empty (`{}`) — the `<div className={classes.toolbar} />` becomes `<div />` or is removed.

- [ ] **Step 5: Replace `<Hidden smUp implementation="css">`**

Current:

```tsx
<IconButton ...>
  <MenuIcon />
  <Hidden smUp implementation="css">
    <Drawer ...>{drawer}</Drawer>
  </Hidden>
</IconButton>
```

`Hidden smUp` = hide at ≥ 600px. But the menu button itself is already hidden ≥ 800px via its `sx`. The `<Hidden>` here only wraps the `<Drawer>`. A `<Drawer>` that isn't open renders nothing anyway. Replace with the Drawer directly (no `Hidden` wrapper):

```tsx
<IconButton ...>
  <MenuIcon />
</IconButton>
<Drawer
  container={container}
  variant="temporary"
  anchor={theme.direction === "rtl" ? "right" : "left"}
  open={mobileOpen}
  onClose={handleDrawerToggle}
  ModalProps={{ keepMounted: true }}
  slotProps={{ paper: { sx: { width: drawerWidth, backgroundColor: "var(--background-overlay)" } } }}
>
  {drawer}
</Drawer>
```

Move the `<Drawer>` to be a sibling of the `<IconButton>` (both inside the `<Squircle className="header-container">`).

- [ ] **Step 6: The `window` prop / `container`**

`const container = window !== undefined ? () => window().document.body : undefined;` — `Header` takes a `window` prop (for the MUI Drawer container, used in tests/SSR). Since there are no tests and this is client-only, simplify:

```tsx
const container =
  typeof window !== "undefined" ? () => window.document.body : undefined;
```

And drop the `props`/`{ window }` destructuring — change `function Header(props: any)` to `function Header()`.

- [ ] **Step 7: Verify the Header renders (desktop + mobile)**

Run `npm run dev`.
- Desktop (> 800px): E.H.K. logo, About/Schedule links, theme toggle. Logo and links have the underline-on-hover animation. Clicking the logo → `/`.
- Mobile (< 800px): hamburger icon appears, links hidden. Click hamburger → drawer slides from the left with E.H.K., About (Info icon), Schedule (Calendar icon), divider, theme toggle pinned at the bottom. Clicking About → navigates to `/` and closes the drawer.

Compare each state to production screenshots.

- [ ] **Step 8: Remove the Material Icons `<link>` from `layout.tsx`** (if still present from Task 2/13).

- [ ] **Step 9: `next build`**

Run: `npm run build`. Expected: no MUI-related errors. There may be a warning about MUI needing an Emotion cache for SSR — that's Task 15, acceptable now.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: MUI v4 to v5 in Header, makeStyles to sx/styled"
```

---

### Task 15: MUI Emotion SSR cache provider

**Files:**
- Create: `src/providers/MuiProvider.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `MuiProvider` — `'use client'` default export, props `{ children }`, provides an Emotion cache flushed via `useServerInsertedHTML` + a MUI `<ThemeProvider>`.

- [ ] **Step 1: Create `src/providers/MuiProvider.tsx`**

Use the official Next App Router pattern:

```tsx
"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme();

export default function MuiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "mui", prepend: true });
    cache.compat = true;
    const prevInsert = cache.insert.bind(cache);
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = "";
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
```

(This is the canonical snippet from the MUI + Next.js App Router docs. Do NOT add `<CssBaseline>`.)

- [ ] **Step 2: Nest it in `layout.tsx`**

Per the global constraint nesting order:

```tsx
import MuiProvider from "../providers/MuiProvider";

// in <body>:
<Providers>
  <MuiProvider>
    <AppShell>{children}</AppShell>
  </MuiProvider>
</Providers>
```

(AntdRegistry goes between MuiProvider and AppShell in Task 16.)

- [ ] **Step 3: Verify — no FOUC on Header**

Run `npm run build && npm run start` (production mode — SSR cache only matters there). Hard reload `/`. Watch the Header on first paint.
Expected: the MUI Drawer/IconButton styles are present from the first frame — no flash of unstyled hamburger. Check `view-source:http://localhost:3000` — there should be a `<style data-emotion="mui ...">` block in the `<head>`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: MUI Emotion SSR cache provider"
```

---

### Task 16: antd v4 → v5 + registry + Switch fidelity

**Files:**
- Modify: `package.json`
- Modify: `src/components/ThemeButton/ThemeButton.tsx`
- Delete: `src/components/ThemeButton/ThemeButton.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `ThemeButton` renders an antd v5 `Switch` that looks identical to today's; `<AntdRegistry>` in the provider tree.

- [ ] **Step 1: Swap packages**

```bash
npm uninstall antd
npm install antd@^5 @ant-design/nextjs-registry
```

- [ ] **Step 2: Delete the vendored CSS**

```bash
git rm src/components/ThemeButton/ThemeButton.css
```

- [ ] **Step 3: Rewrite `ThemeButton.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ConfigProvider, Switch } from "antd";
import { RootState } from "../../redux/reducers";
import { MoonIcon } from "../icons/MoonIcon";
import { SunIcon } from "../icons/SunIcon";

export default function ThemeButton() {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(
    (state: RootState) => state.colorTheme.darkMode
  );

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    dispatch({ type: "TOGGLE_DARK_MODE" });
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Switch: {
            // pin to antd v4 metrics / colors
            trackHeight: 22,
            trackMinWidth: 44,
            trackPadding: 2,
            handleSize: 18,
            colorPrimary: "#1890ff",
            colorPrimaryHover: "#1890ff",
          },
        },
      }}
    >
      <Switch
        className="theme-switch"
        checked={isDarkMode}
        checkedChildren={<MoonIcon className="theme-svg" />}
        unCheckedChildren={<SunIcon className="theme-svg" />}
        onChange={toggleDarkMode}
      />
      <style jsx global>{`
        .theme-svg {
          fill: var(--background-color);
          height: 22px;
          width: 22px;
        }
        .theme-switch.ant-switch {
          background-color: var(--large-heading-color);
        }
        .theme-switch .ant-switch-handle::before {
          background-color: var(--background-color);
        }
      `}</style>
    </ConfigProvider>
  );
}
```

Notes:
- The `console.log("dark")` / `console.log("light")` from the original are dropped.
- The original `useEffect` had no dependency array (ran every render); adding `[isDarkMode]` is correct and behaviorally equivalent for this toggle.
- `<style jsx global>` because the antd hashed classes are outside this component's styled-jsx scope. Keep the two CSS-var overrides that made the track use `--large-heading-color` and the handle use `--background-color`.
- The original used antd v4's default `#1890ff`; the `colorPrimary` token pins v5 to it.

- [ ] **Step 4: Add `<AntdRegistry>` to `layout.tsx`**

```tsx
import { AntdRegistry } from "@ant-design/nextjs-registry";

// nesting (per global constraint):
<Providers>
  <MuiProvider>
    <AntdRegistry>
      <AppShell>{children}</AppShell>
    </AntdRegistry>
  </MuiProvider>
</Providers>
```

- [ ] **Step 5: Verify — screenshot compare the toggle**

Run `npm run build && npm run start`. Open `/` in production mode.

Compare the theme toggle to `https://ethank.tech` at 2–3× browser zoom, in **all these states**:
1. Light mode, unchecked (sun icon, track = light heading color)
2. Dark mode, checked (moon icon, track = dark heading color)
3. Hover on the toggle
4. Mid-press (active) — the handle stretch animation
5. Focus ring

Expected: pixel-identical (or within 1px). If the v5 Switch differs materially (handle position, track radius, checked color, animation), tune the `ConfigProvider` tokens. If it cannot be matched after a reasonable effort, STOP and get approval for the fallback (styled `<button>` port of the v4 Switch CSS — spec §7b).

Also confirm: no FOUC on the Switch on hard reload (the `<AntdRegistry>` handles SSR extraction — check `view-source` for an antd `<style>` block).

- [ ] **Step 6: `next build`**

Run: `npm run build`. Expected: clean, no antd SSR warnings.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: antd v4 to v5, Switch pinned to v4 look, AntdRegistry"
```

---

### Task 17: HeaderLinks — NavLink → next/link + usePathname

**Files:**
- Modify: `src/components/HeaderLinks/HeaderLinks.tsx`

**Interfaces:**
- Consumes: `usePathname` from `next/navigation`.
- Produces: `HeaderLinks` renders `next/link` anchors with the `active-link` class on the current route.

- [ ] **Step 1: Rewrite `HeaderLinks.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./HeaderLinks.css";
import ThemeButton from "../ThemeButton";

export default function HeaderLinks() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `header-link-container${pathname === href ? " active-link" : ""}`;

  return (
    <div className="header-links-container">
      <Link href="/" className={linkClass("/")}>
        <h4 className="header-link">About</h4>
      </Link>
      <Link href="/schedule" className={linkClass("/schedule")}>
        <h4 className="header-link">Schedule</h4>
      </Link>
      <ThemeButton />
    </div>
  );
}
```

Note: label stays "About" and points at `/` — the "Home"/"About" nav rework is Project 2, not this project (global constraint: no `/about` route). This preserves today's behavior exactly.

The commented-out `linkEvent` block at the top of the current file is deleted.

- [ ] **Step 2: Verify — active underline**

Run `npm run dev`. On `/` the "About" link has the persistent accent underline (`.active-link .header-link::after { transform: scaleX(1) }`). On `/schedule` the "Schedule" link does. Hover animates the underline on the inactive one.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: HeaderLinks uses next/link + usePathname"
```

---

### Task 18: Analytics — Vercel Analytics + GA4

**Files:**
- Modify: `package.json`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `<Analytics/>` and (optionally) `<GoogleAnalytics/>` in the layout.

- [ ] **Step 1: Install**

```bash
npm install @vercel/analytics @next/third-parties
```

- [ ] **Step 2: Add `<Analytics/>` to `layout.tsx`**

```tsx
import { Analytics } from "@vercel/analytics/react";

// at the end of <body>, after the provider tree:
<Analytics />
```

- [ ] **Step 3: Add GA4 — conditional on the env var**

```tsx
import { GoogleAnalytics } from "@next/third-parties/google";

// after <Analytics />:
{process.env.NEXT_PUBLIC_GA_ID && (
  <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
)}
```

**User action:** create a GA4 property, get the `G-XXXXXXXXXX` measurement ID, set `NEXT_PUBLIC_GA_ID` in Vercel project settings (Production + Preview). If not available yet, this ships as a no-op and is a 0-code follow-up (just set the env var).

- [ ] **Step 4: Verify**

Run `npm run dev`. No console errors. If `NEXT_PUBLIC_GA_ID` is set locally in `.env.local`, confirm the `gtag` script loads (Network tab). `<Analytics/>` only reports on Vercel — nothing to check locally beyond "no error".

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Vercel Analytics + optional GA4"
```

---

### Task 19: Metadata files, cleanup, dead code, final build

**Files:**
- Create: `src/app/icon.png`, `src/app/apple-icon.png`, `src/app/opengraph-image.png`
- Modify: `src/app/layout.tsx` (metadata)
- Delete: `src/components/Footer/`, `src/components/SocialMediaLinks/`, `src/components/Articles/`, remaining `src/assets/Ethan.jpg`/`Ethan2.jpg`/`Ethan3.jpg` if unused
- Modify: `package.json` (remove `firebase-tools` — or defer to Task 20)

**Interfaces:** none new.

- [ ] **Step 1: File-based metadata images**

```bash
cp public/favicon-32x32.png src/app/icon.png
cp public/apple-touch-icon.png src/app/apple-icon.png
cp public/ogImage.png src/app/opengraph-image.png
```

(`cp`, not `git mv` — keep the `public/` copies too; `favicon.ico` stays in `public/` and Next serves it automatically.)

- [ ] **Step 2: Trim the `metadata` export in `layout.tsx`**

Now that `opengraph-image.png` is a metadata file, simplify:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://ethank.tech"),
  title: "Ethan Keshishian",
  description: "Ethan Keshishian",
};
```

(Next auto-adds the OG image, icon, and apple-icon from the `app/` files. Remove the manual `openGraph.images` from Task 2.)

- [ ] **Step 3: Delete dead components**

```bash
git rm -r src/components/Footer src/components/SocialMediaLinks src/components/Articles
```

- [ ] **Step 4: Check for unused photo assets**

```bash
grep -rn "Ethan\.jpg\|Ethan2\|Ethan3" src/
```

If only `Ethan4.jpg` is referenced, delete the others:

```bash
git rm src/assets/Ethan.jpg src/assets/Ethan2.jpg src/assets/Ethan3.jpg
```

- [ ] **Step 5: Grep for leftover CRA/react-router/MUI-v4 references**

```bash
grep -rn "react-router\|@material-ui\|react-ga\|react-scripts\|react-app-rewired\|ReactComponent\|serviceWorker\|makeStyles" src/
```

Expected: **zero results.** Fix any that remain.

- [ ] **Step 6: Full production build + lint**

```bash
npm run build
npm run lint
```

Expected: build succeeds with zero errors. Lint: address real warnings (unused vars, missing keys). Pre-existing `key` warnings in `Resume.tsx`'s `.map()` may be there from before — fixing them is fine but not required.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: file-based metadata, remove dead components and assets"
```

---

### Task 20: Checkpoint B verification, Vercel production, DNS cutover, Firebase teardown

**Files:**
- Modify: `README.md` (deploy section)
- Delete: `firebase.json`, `.firebaserc`, `.firebase/`
- Modify: `package.json` (remove `firebase-tools`)

- [ ] **Step 1: Full local verification (production mode)**

```bash
npm run build && npm run start
```

Go through the **Checkpoint B verification list** from spec §11:
- Homepage light + dark, side-by-side with `https://ethank.tech`
- **No white flash** for dark-mode users on hard reload (both directions)
- `/schedule` via nav AND direct URL
- `/zoom` → 307 redirect, no white page
- `/nonsense` → not-found page
- Mobile drawer, both themes (screenshot compare)
- antd Switch, all states (screenshot compare)
- `view-source:` on `/` and `/schedule` — real markup + `<head>` metadata present (app container `opacity:0` per §5c is expected)
- Squircle corners on header/photo/project cards
- All fonts (OfficeCodePro, NimbusSanL, Poppins)
- Gradient background animation
- Theme persists across reload
- **Zero hydration warnings** in the console on every route
- `npm run build` — zero errors

Record any deviation. Non-gap deviations are blockers.

- [ ] **Step 2: Push, verify the Vercel preview**

```bash
git push
```

Repeat Step 1's checks against the `cra-to-nextjs` Vercel preview URL. Run Lighthouse on the preview — SEO and Performance must not regress vs current prod (test prod's scores first for the baseline).

- [ ] **Step 3: Merge to master**

**User decision point.** Only merge when the preview passes cleanly.

```bash
git checkout master
git merge --no-ff cra-to-nextjs
git push
```

Vercel deploys `master` to the production Vercel URL (e.g. `ethan-website-react.vercel.app`).

- [ ] **Step 4: DNS cutover**

**User actions:**
1. In Vercel project settings → Domains → add `ethank.tech` (and `www.ethank.tech` if used).
2. Vercel shows the required DNS records (A record → `76.76.21.21` or a CNAME, per Vercel's current instructions).
3. Lower the TTL on the current Firebase DNS records first (wait for propagation), then update the records to point at Vercel.
4. Wait for Vercel to show the domain as "Valid Configuration" and serving via HTTPS.
5. Verify `https://ethank.tech` serves the new Next.js site.

Firebase Hosting stays live and configured during this — it just stops receiving traffic once DNS moves.

- [ ] **Step 5: Set the GA4 env var** (if not done in Task 18)

**User action:** Vercel → project → Settings → Environment Variables → `NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX` for Production and Preview. Redeploy.

- [ ] **Step 6: Soak**

Leave it ~1 week. Watch Vercel Analytics + GA4 for traffic. Check the site on real mobile Safari + Firefox (the `corner-smoothing` / `backdrop-filter` history — spec risk table).

- [ ] **Step 7: Firebase teardown**

After the soak, on a new branch:

```bash
git checkout -b remove-firebase
git rm firebase.json .firebaserc
git rm -r .firebase
npm uninstall firebase-tools
```

Rewrite the README "Notes on deployment" section:

```markdown
## Deployment

The site is hosted on Vercel. Every push to `master` deploys to production;
every branch/PR gets a preview URL automatically. No manual deploy step.

Local dev: `npm run dev` (http://localhost:3000).
Production build check: `npm run build && npm run start`.
```

Commit, PR, merge.

```bash
git add -A
git commit -m "chore: remove Firebase Hosting, Vercel is the deploy target"
```

- [ ] **Step 8: Update this plan with Checkpoint B results**

Append a "Checkpoint B / cutover results" note. Commit.

---

## Self-Review

### 1. Spec coverage

| Spec section | Task(s) |
|---|---|
| §2 two checkpoints | Task 8 (A gate), Task 20 (B gate) |
| §3 file structure — layout, providers, routes | Tasks 2, 9, 10, 15, 16 |
| §3 deleted files | Tasks 4, 7, 9, 19; Firebase in 20 |
| §4 routing — react-router removal, `/zoom` handler | Tasks 9, 10, 17 |
| §4 server/client boundary | Task 9 Step 6, Task 10 Step 1 |
| §5a Redux `Providers` (useRef store) | Task 9 Step 1 |
| §5b dark-mode pre-paint script | Task 11 |
| §5c `imageLoaded` gate ported, `AppShell` | Task 9 Step 2 |
| §5c provider nesting order | Tasks 9, 15, 16 (assembled incrementally) |
| §6a fonts — local → public, Poppins next/font all weights | Tasks 2, 13 |
| §6b images — photo `.src`, og/favicon → app/ | Tasks 12, 19 |
| §6c SVG → inline components | Task 6 |
| §6d `require()` logos → public/ | Task 5 |
| §7a MUI v4→v5, makeStyles→sx | Task 14 |
| §7a Emotion SSR cache | Task 15 |
| §7b antd v4→v5, registry, Switch fidelity | Task 16 |
| §7c styled-jsx kept | Task 16 Step 3 |
| §8 analytics — react-ga out, Vercel + GA4 in | Tasks 4, 18 |
| §9 deps add/remove | Tasks 1, 7, 14, 16, 18, 19, 20 |
| §9 config files | Tasks 1, 2, 7 |
| §10 Vercel setup | Tasks 8, 20 |
| §11 verification | Tasks 8, 20 |
| §12 risks — corner-smoothing, drawer drift, Switch, pre-paint shape | Tasks 9/14/16/11 verification steps |

No gaps.

### 2. Placeholder scan

- No "TBD"/"TODO"/"implement later".
- Task 11 Step 1 says "record the actual shape here" — that's a deliberate verify-then-write instruction, not a placeholder; the script in Step 2 is complete and works for the expected shape.
- Task 18 GA4 ID is explicitly a user-provided value with a defined no-op fallback — not a plan gap.
- Every code step has a full code block.

### 3. Type / name consistency

- `Providers` — default export, `{ children }` — Task 9, referenced Tasks 9/15/16. Consistent.
- `AppShell` — default export, `{ children }`, reads `state.readyToLoad.imageLoaded` — Task 9. Matches `App.tsx`'s current selector path. Consistent.
- `MuiProvider` — default export, `{ children }` — Task 15, referenced Task 16. Consistent.
- `MoonIcon` / `SunIcon` — named exports, `{ className?: string }` — Task 6, used Tasks 6/16. Consistent.
- `ScheduleClient` — default export — Task 10, used Task 10. Consistent.
- `EDIT_IMAGE_LOADED` / `TOGGLE_DARK_MODE` action strings — unchanged from current reducers, used Tasks 9/10/16. Consistent.
- `linkType` / `buttonType` — kept in `constants.tsx` (Task 4) because... actually `SocialMediaIcons` drops its usage in Task 4 Step 3. **Check:** after Task 4, is anything still importing `linkType`/`buttonType`? `SocialMediaLinks` (deleted Task 19) and `SocialMediaIcons` (usage removed Task 4). So after Task 4, `linkType`/`buttonType` are exported but unused. **Fix:** Task 4 Step 2 keeps them (harmless, and `linkType` string values could matter for future analytics); Task 19 Step 5's grep won't flag them. Acceptable — leaving two unused enums is not worth an extra step. If lint flags them as unused exports it won't (exports aren't "unused"). Leave as-is.
- `next dev` port: global constraints note the 3001 fallback; all tasks say `localhost:3000` — acceptable, executor adjusts if needed.

No blocking inconsistencies.
