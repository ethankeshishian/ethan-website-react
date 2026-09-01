# CRA → Next.js Migration — Design Spec

**Date:** 2026-08-31
**Status:** Approved for implementation planning
**Project:** 1 of 2 (this = migration; Project 2 = blog feature, specced separately after this merges)

---

## 1. Goal

`ethank.tech` runs on **Next.js (App Router, latest — 16.x, React 19)**, deployed on **Vercel**, **visually and behaviorally identical to production today**. No blog in this project. When it merges, DNS cuts over from Firebase Hosting to Vercel and the Firebase deploy path is retired.

The value of this project is not "a working Next SPA" (that's an intermediate checkpoint). It is: real file-based routing, server-rendered HTML, `next/font`, React 19, and the removal of the dead `react-scripts` / UA-analytics / React-16 toolchain — the foundation the blog is built on.

### Non-goals

- No `/about` route (arrives with Project 2 when `/` becomes the blog list).
- No blog, markdown pipeline, sitemap, or RSS.
- No redesign. No component restructuring beyond what the migration forces.
- No state-management migration — Redux stays.
- No change to the `imageLoaded` load-gate behavior.
- Not finishing the `corner-smoothing` → `corner-shape` swap (only touched if it breaks under React 19).

---

## 2. Rollout

### Branching

- **Branch 1 — `cra-to-nextjs`** (this project). Merges to `master` only after Checkpoint B passes on a Vercel preview URL. DNS cutover happens at merge.
- **Branch 2 — blog** (Project 2). Built on clean Next after Branch 1 merges. Separate spec + plan.

### Two checkpoints within Branch 1

**Checkpoint A — "Next SPA, identical UX"** (~1 day)
The official Vercel codemod path. The app remains a client-rendered SPA with `react-router` intact *inside* `<App />`; Next just wraps it via an optional catch-all route. Low-risk, fully reversible. Deployed to a Vercel preview and compared side-by-side with current production — must be pixel-indistinguishable.

**Checkpoint B — "Real Next.js"** (~3–5 days)
File-based routes replace `react-router`; the `[[...slug]]` catch-all route and its `client.tsx` are **deleted** once `app/page.tsx` / `app/schedule/page.tsx` / `app/zoom/route.ts` exist; `next/font`; MUI v5; antd v5; GA4; SSR-safe Redux provider; dark-mode pre-paint script. This is the checkpoint that gets reviewed and merged. `<App />`, `App.css`, and `react-router-dom` are also deleted here.

---

## 3. Target file structure (end of Checkpoint B)

```
src/
  app/
    layout.tsx            server — <html>/<body>, pre-paint script, global CSS, next/font, metadata, analytics, provider tree wrapping {children}
    globals.css           former src/index.css content (fonts, resets)
    page.tsx              "/" — renders <About/>
    schedule/
      page.tsx            "/schedule" — renders <Schedule/> (client-dynamic)
    zoom/
      route.ts            "/zoom" — Route Handler, 307 → ZOOM
    not-found.tsx         404
    icon.png              favicon (file-based metadata)
    apple-icon.png        apple-touch-icon
    opengraph-image.png   former public/ogImage.png
    robots.ts             (optional) former public/robots.txt
    sitemap.ts            (optional) lists "/" and "/schedule"
  providers/
    Providers.tsx         'use client' — Redux <Provider> + <PersistGate>, store via useRef
    MuiProvider.tsx       'use client' — Emotion cache (useServerInsertedHTML) + <ThemeProvider>
    AppShell.tsx          'use client' — the imageLoaded gate + <Header> + body wrapper (former App.tsx body)
  components/             mostly unchanged; several become 'use client'
    Header/  HeaderLinks/  ThemeButton/  About/  Resume/  Squircle/  SquircleImage/
    SocialMediaIcons/
    icons/                new — MoonIcon.tsx, SunIcon.tsx (former assets/*.svg)
  redux/                  unchanged: configureStore.tsx, reducers/{index,readyToLoad,colorTheme}.tsx
  constants.tsx  constants.css
  assets/                 Ethan4.jpg, patterns/  (fonts + logos move to public/)
public/
  fonts/                  former src/assets/fonts/*
  logos/                  former src/assets/logos/*.jpeg
  favicon.ico  manifest.json  (kept)
next.config.ts
next-env.d.ts             gitignored
tsconfig.json             Next-extended
.eslintrc.json           eslint-config-next
```

### Deleted files

`src/App.tsx`, `src/App.css`, `src/index.tsx`, `src/index.css` (→ `app/globals.css`), `src/serviceWorker.ts`, `src/App.test.tsx`, `src/setupTests.ts`, `src/react-app-env.d.ts`, `src/components/Body/`, `src/components/ScrollToTop.tsx`, `src/components/Footer/` (unrendered), `src/components/SocialMediaLinks/` (unrendered), `src/components/Articles/` (old stub), `src/components/ThemeButton/ThemeButton.css` (28k-line vendored antd v4 copy — antd v5 injects its own via the registry), `public/index.html`. At cutover: `firebase.json`, `.firebaserc`, `.firebase/`.

---

## 4. Routing

`react-router-dom@5` and `@types/react-router-dom` are **fully removed**. No `BrowserRouter`, `Switch`, `Route`, `NavLink`, `useHistory`, `useLocation` anywhere.

| Current | Becomes |
|---|---|
| `Body.tsx` `<Switch>` with 3 `<Route>` | Deleted — routes are `app/*/page.tsx` files |
| `App.tsx` `<Router>` + header/body divs | Deleted — layout moves to `app/layout.tsx` |
| `ScrollToTop.tsx` | Deleted — App Router scrolls to top on navigation by default |
| `HeaderLinks.tsx` `<NavLink to="/" exact activeClassName>` | `next/link` + `usePathname()` for the active class; `'use client'` |
| `Header.tsx` `useHistory().push()` (mobile drawer), `<a href="/">` logo | `useRouter()` from `next/navigation`; logo → `<Link href="/">`; `'use client'` |
| `Schedule.tsx` `react-calendly <InlineWidget>` | `'use client'` + `dynamic(() => import(...), { ssr: false })` — Calendly touches `window` |
| `Body.tsx` `/zoom` → `window.location.replace(ZOOM)` | `app/zoom/route.ts` → `Response.redirect(ZOOM, 307)` — real server redirect, no flash |

### Server / client boundary

- **Server components:** `layout.tsx`, `page.tsx`, `schedule/page.tsx` (they only compose).
- **Client components (`'use client'`):** `Header`, `HeaderLinks`, `ThemeButton`, `About`, `Resume`, `Squircle`, `SquircleImage`, `Schedule`, both providers. They use hooks / Redux / `ResizeObserver` / `window` / MUI / antd. Client components still prerender to HTML at build.
- Rule: mark the leaf-most interactive component; keep `page.tsx` / `layout.tsx` as server components.

---

## 5. State, theme, load gate

### 5a. Redux (kept)

`src/providers/Providers.tsx` — `'use client'`, holds `<Provider store>` + `<PersistGate loading={null}>`. **Store created once via `useRef`**, not module scope (avoids cross-request state bleed on the server). `app/layout.tsx` (server) wraps `{children}` in `<Providers>`.

`redux`, `react-redux`, `redux-persist`, `configureStore.tsx`, `reducers/*` — unchanged. The only persisted value is `colorTheme.darkMode` (`readyToLoad` is blacklisted). This machinery is retained deliberately; a Redux-vs-context cleanup is a possible separate future task, out of scope here.

### 5b. Dark mode — pre-paint script

Today `ThemeButton` toggles `document.body.classList` in a `useEffect`; under SSR that runs after first paint → dark-mode users get a white flash on every load.

Fix: a **blocking inline `<script>`** in `app/layout.tsx` `<head>`, runs before paint:

```js
try {
  var p = JSON.parse(localStorage.getItem('persist:root') || '{}');
  var t = JSON.parse(p.colorTheme || '{}');
  if (t.darkMode) document.body.classList.add('dark-mode');
} catch (e) {}
```

- `ThemeButton` keeps its Redux toggle **and** its existing `useEffect` that syncs `body.classList` for in-session toggling. The inline script only sets the *initial* pre-paint state.
- All CSS already keys off `body.dark-mode` — **no CSS changes.**
- **Verify in Checkpoint B:** confirm the exact `redux-persist` serialization — the persisted key is `persist:root`, whose `colorTheme` field is a JSON *string* `"{\"darkMode\":true,\"_persist\":...}"`. The script must parse the nested string correctly. If the shape differs, adjust the script.

### 5c. `imageLoaded` load gate — ported exactly as-is

`App.tsx` today renders `<div className={imageLoaded ? "App app-fade" : "App notReadyToLoad"}>` — the **entire app** is `opacity: 0` until the profile photo's `onLoad` fires (dispatched from `About` via `SquircleImage`), then a 0.5s `appfade`. `Schedule` force-dispatches `EDIT_IMAGE_LOADED: true` on mount so its route isn't stuck hidden.

**This behavior is preserved unchanged.** `app/layout.tsx` is a server component and cannot call `useSelector`, so the gate lives in a **client wrapper component** — `src/providers/AppShell.tsx` (`'use client'`), rendered by `layout.tsx` around `{children}` (inside the providers). It reads the `imageLoaded` selector and applies the same `notReadyToLoad` / `app-fade` classes to the app container `<div>`. `About` and `Schedule` keep their `EDIT_IMAGE_LOADED` dispatches. The `readyToLoad` reducer, the `EDIT_IMAGE_LOADED` action, and the `.notReadyToLoad` / `.app-fade` / `@keyframes appfade` CSS are all retained — the CSS moves from `App.css` into `globals.css`.

`AppShell` also renders the `<Header>` and the `<main>`/body wrapper that `App.tsx` currently provides (the fixed-position `.header` div, the `.body` div). Provider nesting order in `layout.tsx`: `<Providers>` (Redux) → `<MuiProvider>` (Emotion + MUI theme) → `<AntdRegistry>` → `<AppShell>` → page `{children}`.

**Accepted consequence:** prerendered HTML for every route is `opacity: 0` until JS + the photo load, so crawlers / link-unfurlers see a blank page on first fetch. This mutes — but does not negate — the SEO gain of the migration (real routing, real `<head>`, server redirect for `/zoom`, no render-blocking font links still help). Project 2 revisits this: the blog pages have no photo and will get an immediate-render path, decided in that spec.

---

## 6. Fonts, images, SVGs, dynamic require

### 6a. Fonts

- **Local faces** (OfficeCodePro ×8, NimbusSanL ×8): move `src/assets/fonts/` → `public/fonts/`. Keep the 16 `@font-face` blocks in `app/globals.css`, update `url()` → `/fonts/…`. (Not using `next/font/local` — 16 face declarations to port for marginal gain; plain `@font-face` is fine.)
- **Poppins:** `next/font/google` in `layout.tsx`, **all weights 100–900** (matching the current `<link>` — no trimming), applied to `<body>` as today. Self-hosted at build, no render-blocking request.
- **Material Icons `<link>`:** removed. Only MUI's Header icons used it; `@mui/icons-material` (v5) ships SVGs.

### 6b. Images

- **Profile photo** `src/assets/Ethan4.jpg`: stays a static import. `SquircleImage` uses it as a CSS `--image-url` background (not `<img>`), so `next/image` doesn't apply. Next's static import returns `{ src }` → `SquircleImage` uses `photo.src`. Its `new Image()` preload in `useEffect` still fires `onLoad` for the gate.
- **Logos:** see 6d.
- **og / favicons:** `public/ogImage.png` → `app/opengraph-image.png`; favicons → `app/icon.png` + `app/apple-icon.png` (file-based metadata auto-wires `<head>`). `public/favicon.ico` and `manifest.json` kept.

### 6c. SVG imports

`ThemeButton` does `import { ReactComponent as MoonIcon } from "../../assets/moon.svg"` (CRA SVGR — not supported in Next by default). Convert `moon.svg` + `sun.svg` to two inline React components in `src/components/icons/` (`MoonIcon.tsx`, `SunIcon.tsx`, ~10 lines each). No `@svgr/webpack`, no Turbopack opt-out.

### 6d. Dynamic `require()` for logos

`Resume.tsx` does `require("../../assets/logos/" + item.logo).default` in 3 places (education, experience, projects) — webpack-only, breaks in Next.

Move `src/assets/logos/` → `public/logos/`, change to `src={`/logos/${item.logo}`}`. The resume JSON already stores bare filenames (`"mercury.jpeg"`). Plain `<img>` (not `next/image`) — logos are small, not LCP-critical, matches current behavior.

---

## 7. UI libraries

### 7a. Material UI v4 → v5

**Remove:** `@material-ui/core`, `@material-ui/icons`, `material-ui` (v0 — vestigial, confirm unused then delete).
**Add:** `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@emotion/cache`.

**`Header.tsx` API changes:**

| v4 | v5 |
|---|---|
| `import X from "@material-ui/core/X"` | `import { X } from "@mui/material"` |
| `import Icon from "@material-ui/icons/Menu"` | `import MenuIcon from "@mui/icons-material/Menu"` |
| `makeStyles` / `useStyles` (**removed in v5**) | Rewrite the ~55-line `useStyles` block as `styled()` components and/or `sx` props |
| `useTheme`, `theme.breakpoints.up(800)`, `theme.spacing()`, `theme.mixins.toolbar` | Same APIs, work in v5 |

The `makeStyles` → `sx`/`styled` rewrite is the bulk of the Header work: the drawer, the responsive `display: none` on the menu button (`breakpoints.up(800)`), the `position: fixed` theme-button container at the drawer bottom. Port each rule 1:1.

**SSR setup:** `src/providers/MuiProvider.tsx` (`'use client'`) — Emotion cache created with `createCache`, flushed via `useServerInsertedHTML` (the documented Next App Router pattern), wrapping `<ThemeProvider theme={...}>`. **No `<CssBaseline>`** — the site has its own resets; CssBaseline would change base styles. Provider nesting order is defined in §5c.

### 7b. antd v4 → v5 (KEPT — toggle must look exactly as today)

**Only usage:** `ThemeButton.tsx` — `import { Switch } from "antd"`, the theme toggle.

**Remove:** `antd@4`, the vendored `ThemeButton.css` (28k-line copy of antd v4's full stylesheet).
**Add:** `antd@5`, `@ant-design/nextjs-registry`.

**API:** v5 `Switch` keeps `checked`, `onChange`, `checkedChildren`, `unCheckedChildren`, `className` — no code changes to the props. The `styled-jsx` block in `ThemeButton.tsx` targeting `.ant-switch-handle::before` / `.theme-switch` may need selector updates (v5 uses hashed class names) — likely move those two overrides (`.theme-switch` background = `var(--large-heading-color)`, handle `::before` background = `var(--background-color)`) onto the component via `ConfigProvider` component tokens or `sx`.

**SSR setup:** `<AntdRegistry>` from `@ant-design/nextjs-registry` — a client provider in `layout.tsx` that extracts antd's CSS-in-JS on the server.

**Fidelity requirement:** antd v5's default Switch differs subtly from v4 (checked color `#1677ff` vs `#1890ff`, handle metrics, active-press animation). The current look is **v4's default Switch (min-width 44px, height 22px, handle 18px, `#1890ff` checked, `box-shadow: 0 2px 4px 0 rgba(0,35,11,0.2)` on the handle) plus** the two `styled-jsx` CSS-var overrides. To hit "exactly as today," pin the v5 Switch via `<ConfigProvider theme={{ token: {...}, components: { Switch: {...} } }}>` reproducing v4's metrics and the CSS-var overrides. This is a **screenshot-compare item** in Checkpoint B (toggle in both positions, both themes, hover, active-press).

**Fallback (only if antd v5 can't be made pixel-identical within reason):** port the ~90 lines of v4 Switch CSS into a plain styled `<button>` and drop antd. Requires explicit approval at that point.

### 7c. styled-jsx

`ThemeButton` uses `<style jsx>` — **built into Next**, works in client components, no config. Keep. `@types/styled-jsx` dep can be removed (types are bundled).

---

## 8. Analytics

`App.tsx` calls `ReactGA.initialize("UA-171410103-1")` + `ReactGA.pageview("/homepage")`. `react-ga` is the **Universal Analytics** SDK; **UA stopped processing data July 2023** — this tracking is dead. `linkEvent()` in `constants.tsx` (fired from social-icon clicks) is also dead.

- **Remove:** `react-ga`, `initialize`/`pageview` calls, `linkEvent` + its call sites (`SocialMediaIcons.tsx`; also the dead `SocialMediaLinks.tsx` which is being deleted anyway). The `linkType` / `buttonType` enums stay if still referenced, else removed.
- **Add:** **Vercel Analytics** — `@vercel/analytics/react` `<Analytics/>` in `layout.tsx` (page views + Web Vitals, no account setup). **GA4** — `@next/third-parties/google` `<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />` in `layout.tsx`; handles route-change pageviews automatically.
- **User provides:** a GA4 property + `G-XXXXXXX` measurement ID, set as `NEXT_PUBLIC_GA_ID` in Vercel project settings. If not ready at implementation time, ship with Vercel Analytics only and add the `<GoogleAnalytics>` line + env var later (2-line change).

---

## 9. Config & dependencies

### Removed

`react-scripts`, `react-app-rewired` (dead — no `config-overrides.js`), `@material-ui/core`, `@material-ui/icons`, `material-ui`, `antd`(→v5), `react-ga`, `react-router-dom`, `@types/react-router-dom`, `@types/styled-jsx`, `@testing-library/*` + `@types/jest` (no real tests), `firebase-tools` (at cutover).

### Added

**Runtime:** `next` (latest), `react@19`, `react-dom@19`, `antd@5`, `@ant-design/nextjs-registry`, `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@emotion/cache`, `@vercel/analytics`, `@next/third-parties`.
**Dev:** `typescript@^5`, `@types/react@19`, `@types/react-dom@19`, `@types/node` (bump), `eslint`, `eslint-config-next`.
**Kept:** `react-calendly` (works client-only), `corner-smoothing`, `redux`, `react-redux`, `redux-persist`, `styled-jsx` (transitively via Next but keep explicit if referenced).

### Config files

- **`next.config.ts`** — minimal. No `output: 'export'` (Vercel; server features stay available). No custom webpack. `images` config only if a remote host is ever referenced (none today).
- **`tsconfig.json`** — Next extends it on first run: `target` up from `es5`, `jsx: "preserve"`, `moduleResolution: "bundler"`, `plugins: [{ name: "next" }]`, `include` gains `next-env.d.ts` + `.next/types/**/*.ts`. Keep `strict: true`, `resolveJsonModule: true`.
- **`.eslintrc.json`** — `{ "extends": "next/core-web-vitals" }`.
- **`package.json` scripts** — `dev: "next dev"`, `build: "next build"`, `start: "next start"`, `lint: "next lint"`. Remove `test`, `eject`.
- **`.gitignore`** — add `.next`, `next-env.d.ts`, `.vercel`.
- **`.env`** — none committed; `NEXT_PUBLIC_GA_ID` set in Vercel.
- **`firebase.json` / `.firebaserc`** — deleted at cutover.

### Node / build

The `NODE_OPTIONS=--openssl-legacy-provider` workaround is **gone** — Next 16 has no dependency on the legacy OpenSSL provider. `yarn build` / `npm run build` just works on Node 22.

---

## 10. Vercel setup (manual, by the user)

1. Import the GitHub repo at vercel.com → Next.js auto-detected.
2. First deploy off Branch 1 → preview URL for review.
3. Set `NEXT_PUBLIC_GA_ID` env var (when available).
4. On merge to `master`: production deploy.
5. Add `ethank.tech` as a custom domain in Vercel **before** changing DNS; update the A / CNAME records per Vercel's instructions. Firebase Hosting stays live until Vercel serves `ethank.tech` correctly (low DNS TTL beforehand).
6. After ~1 week stable on Vercel: tear down Firebase Hosting; delete `firebase.json` / `.firebaserc` / `.firebase/` and `firebase-tools` from the repo; rewrite the README deploy section.

---

## 11. Verification

### Checkpoint A (Next SPA) — side-by-side with current production

Homepage (light + dark), `/schedule`, `/zoom` redirect, mobile hamburger drawer (open/close, both themes), theme toggle + persistence across reload, the `imageLoaded` fade-in, squircle corners (header, photo, project cards), every font (OfficeCodePro, NimbusSanL, Poppins), the gradient background animation. Deployed to a Vercel preview. **Must be pixel-indistinguishable from prod.**

### Checkpoint B (real Next) — everything above, plus

- No white flash for dark-mode users on cold load (pre-paint script working).
- Direct navigation (not client-side) to `/schedule` renders correctly.
- `/zoom` server-redirects (307) without a visible white page.
- `not-found.tsx` renders for an unknown path.
- `next build` completes with **zero errors** and no new warnings.
- **No React hydration warnings** in the browser console on any route.
- `view-source:` on `/` and `/schedule` shows real markup (the app shell, `<head>` metadata) — accepting that the app container carries `opacity: 0` per §5c.
- Lighthouse: SEO and performance scores not regressed vs current prod.
- antd Switch screenshot-compared to prod in all states (§7b).
- MUI Header drawer screenshot-compared to prod (§7a).

### Tests

No test files exist beyond the broken CRA default (`App.test.tsx` tests for "learn react"). Test tooling is dropped with `react-scripts`. Adding `vitest` + RTL is a possible future task, out of scope.

---

## 12. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `corner-smoothing` (Squircle) misbehaves as `'use client'` under React 19 StrictMode double-invoke | Medium | Already client-only (`ResizeObserver`). Test in Checkpoint A. Fallback: finish the `corner-shape` swap (working CSS exists from prior work). |
| `makeStyles` → `sx` rewrite of the Header drawer introduces layout drift | Medium | Port each rule 1:1; screenshot-compare the mobile drawer open/closed, both themes. |
| React 16 → 19 surfaces issues in `redux-persist` or `react-calendly` | Medium | `redux-persist` 6.x supports React 18/19; `react-calendly` is `dynamic(ssr:false)`, client-only. Test both in Checkpoint A. |
| Emotion SSR cache setup → FOUC or hydration mismatch on MUI | Medium | Use the exact documented `useServerInsertedHTML` pattern; no `CssBaseline`. |
| antd v5 Switch not pixel-identical to v4 | Medium | Pin via `ConfigProvider` component tokens (§7b). Fallback: styled `<button>`, with approval. |
| `next/font` self-hosting Poppins shifts metrics vs the Google `<link>` | Low | Same font files; tune `font-display`. Visual check. |
| DNS cutover propagation / downtime | Low | Add domain to Vercel before DNS change; low TTL; Firebase live until Vercel verified. |
| Pre-paint dark-mode script reads the wrong `localStorage` shape | Medium | Verify exact `redux-persist` serialization in Checkpoint B before relying on it. |
| Turbopack (Next default dev) incompatibility | Low | Fall back to `next dev --webpack`. |

### Rollback

Branch 1 is never merged until Checkpoint B passes on a preview. If it fails, abandon the branch — `master` (CRA on Firebase) is untouched. Post-merge: Vercel retains every deployment for instant rollback; Firebase Hosting stays configured (not torn down) for ~1 week of stable Vercel prod.

---

## 13. Decision summary

| Area | Decision |
|---|---|
| Approach | Branch 1, 2 checkpoints: (A) codemod → identical Next SPA, (B) real App Router |
| Rollout | Branch 1 = migration → merge + DNS cutover to Vercel; Branch 2 = blog (separate spec) |
| Hosting | Vercel; Firebase files + dep removed at cutover; README rewritten |
| Routing | App Router file routes; `react-router` + `Body.tsx` + `App.tsx` + `ScrollToTop` deleted; `/zoom` → Route Handler 307 |
| State | Redux kept; `'use client'` `Providers` wrapper (store via `useRef`, `PersistGate`) |
| Dark mode | Pre-paint inline `<script>` reads `persist:root`; `ThemeButton` keeps Redux toggle + sync effect |
| Load gate | `imageLoaded` ported exactly as-is (app-wide `opacity: 0`) |
| Fonts | Local `@font-face` → `public/fonts/` + `globals.css`; Poppins **all weights** via `next/font/google`; Material Icons `<link>` removed |
| Images | Logos → `public/logos/` (path `<img>`); photo static import (`photo.src`); og/favicon → `app/` metadata files |
| SVGs | 2 theme icons → inline components in `src/components/icons/` |
| MUI | v4 → v5 + `@mui/icons-material` + Emotion SSR cache (`useServerInsertedHTML`); `makeStyles` → `sx`/`styled`; no `CssBaseline` |
| antd | **Kept, v4 → v5** + `<AntdRegistry>`; vendored 28k-line CSS deleted; Switch pinned via `ConfigProvider` tokens; screenshot-verified |
| Analytics | Vercel Analytics + GA4 (`@next/third-parties`, user provides `G-` ID); `react-ga` + `linkEvent` removed |
| Tests | None exist; test tooling dropped with `react-scripts` |
| Dead code | `Footer/`, `SocialMediaLinks/`, `Articles/`, `serviceWorker.ts`, `react-app-rewired` removed |
