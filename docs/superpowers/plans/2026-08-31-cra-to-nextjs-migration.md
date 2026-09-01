# CRA → Next.js Migration Implementation Plan (REVISED — single pass)

> **For agentic workers:** Use superpowers:executing-plans. Steps use `- [ ]` checkboxes.

**Goal:** Migrate `ethank.tech` from Create React App to Next.js (App Router, React 19) on Vercel, visually and behaviorally identical to production today.

**Why revised:** The original two-checkpoint plan assumed the CRA `<App/>` could render under React 19 wrapped in a Next catch-all route ("Checkpoint A"). It cannot — **MUI v4 and antd v4 use `ReactDOM.findDOMNode` and legacy context, both removed in React 19**. There is no "identical SPA" intermediate state. The MUI v5 + antd v5 upgrades and the react-router → App Router migration must all land before the app renders. This revision is a single pass with one verification at the end.

**Work already done (commits `cf20ecc`..`9d5c598` on branch `cra-to-nextjs`), all still valid:**
- Next 16.3.4 + React 19.2 + TS 5.9 installed; `.npmrc` has `legacy-peer-deps=true`
- `next.config.ts` (has `typescript.ignoreBuildErrors: true` + `turbopack.root` — the ignore flag is removed in Task R9)
- `src/app/layout.tsx` (root layout, keeps Poppins + Material Icons `<link>` for now), `src/app/globals.css` (index.css + App.css merged, font paths → `/fonts/`)
- fonts → `public/fonts/`, logos → `public/logos/`
- `src/app/[[...slug]]/` catch-all + `client.tsx` (Redux provider inline — **deleted in Task R2**)
- `react-ga` removed from `App.tsx` + `constants.tsx`; `linkEvent` removed; `SocialMediaIcons` handlers stripped
- `Footer/`, `SocialMediaLinks/`, `Articles/`, `src/index.tsx`, `serviceWorker.ts`, `App.test.tsx`, `setupTests.ts`, `react-app-env.d.ts`, `public/index.html` deleted
- theme SVGs → `src/components/icons/{MoonIcon,SunIcon}.tsx`; `ThemeButton` imports updated
- `configureStore.tsx` — `window` access guarded for SSR
- `package.json` scripts → `next dev/build/start/lint`; `react-scripts`, `react-app-rewired`, testing libs, `styled-jsx@3`, `yarn`, `@types/react-router-dom` uninstalled
- `.eslintrc.json` created

**Spec:** `docs/superpowers/specs/2026-08-31-cra-to-nextjs-migration-design.md`

## Global Constraints

- **Visual/behavioral parity** with `https://ethank.tech` — verified in the browser at the end. No redesign.
- Next latest (16.x), React `^19`, TS `^5`. No `output: "export"`.
- Routes: `/` (About), `/schedule`, `/zoom`. **No `/about`** (Project 2).
- **`imageLoaded` gate ported exactly** — app container `notReadyToLoad` (`opacity:0`) → `app-fade` when the photo loads.
- **Redux stays.** `redux`, `react-redux`, `redux-persist`, `configureStore.tsx`, `reducers/*` unchanged except SSR guards.
- **antd stays** (v4→v5). Theme toggle Switch must look exactly as today — pin via `ConfigProvider` tokens; screenshot-verify. Fallback (styled `<button>`) needs approval.
- **Poppins all weights** via `next/font/google`.
- **Provider nesting** in `layout.tsx`: `<Providers>` (Redux) → `<MuiProvider>` (Emotion + MUI theme) → `<AntdRegistry>` → `<AppShell>` (imageLoaded gate + Header + body) → page `{children}`.
- Commit after every task. Branch: `cra-to-nextjs`. Dev server: `next dev` (use `-p 3002` if 3000/3001 taken).
- `NODE_OPTIONS=--openssl-legacy-provider` is gone — do not reintroduce.

---

## File Structure (target)

Created: `src/providers/{Providers,MuiProvider,AppShell}.tsx`, `src/app/page.tsx`, `src/app/schedule/page.tsx`, `src/components/Schedule/ScheduleClient.tsx`, `src/app/zoom/route.ts`, `src/app/not-found.tsx`, `src/app/{icon,apple-icon,opengraph-image}.png`.

Deleted (Task R2): `src/app/[[...slug]]/`, `src/App.tsx`, `src/App.css` (content already in globals.css), `src/components/Body/`, `src/components/ScrollToTop.tsx`.

Modified: `Header.tsx` (MUI v5, no react-router), `HeaderLinks.tsx` (next/link + usePathname), `ThemeButton.tsx` (antd v5), `About.tsx` (photo `.src`), all interactive components get `'use client'`, `layout.tsx` (providers, next/font, pre-paint script, metadata), `next.config.ts` (drop ignoreBuildErrors), `package.json`.

---

### Task R1: Install MUI v5, antd v5, Emotion, providers deps

**Files:** `package.json`

- [ ] **Step 1: Install**

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled @emotion/cache antd@^5 @ant-design/nextjs-registry @vercel/analytics @next/third-parties
npm uninstall @material-ui/core @material-ui/icons material-ui antd
```

(`.npmrc` already forces `legacy-peer-deps`.)

- [ ] **Step 2: Verify versions**

```bash
node -e "const p=require('./package.json').dependencies; console.log(p['@mui/material'], p['antd'], p['@emotion/react'])"
```

Expected: `@mui/material` ^7 (or ^6), `antd` ^5, `@emotion/react` ^11.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap MUI v4->v5, antd v4->v5, add emotion + analytics deps"
```

---

### Task R2: Redux Providers + AppShell, real `/` route, delete catch-all & App

**Files:**
- Create: `src/providers/Providers.tsx`, `src/providers/AppShell.tsx`, `src/app/page.tsx`
- Delete: `src/app/[[...slug]]/`, `src/App.tsx`, `src/App.css`, `src/components/Body/`, `src/components/ScrollToTop.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- `Providers` — `'use client'` default export, `{ children }`, Redux `<Provider>` + `<PersistGate>`, store via `useRef`.
- `AppShell` — `'use client'` default export, `{ children }`, reads `state.readyToLoad.imageLoaded`, renders `<div className={imageLoaded ? "App app-fade" : "App notReadyToLoad"}>` with `.header` div (`<Header/>`) + `.body` div (`{children}`).

- [ ] **Step 1: Create `src/providers/Providers.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import configureStore from "../redux/configureStore";

export default function Providers({ children }: { children: React.ReactNode }) {
  const ref = useRef<ReturnType<typeof configureStore>>(undefined);
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

- [ ] **Step 4: Update `src/app/layout.tsx` `<body>`**

Add imports:

```tsx
import Providers from "../providers/Providers";
import AppShell from "../providers/AppShell";
```

Change `<body>{children}</body>` to:

```tsx
<body>
  <Providers>
    <AppShell>{children}</AppShell>
  </Providers>
</body>
```

(MuiProvider + AntdRegistry inserted in R5/R6.)

- [ ] **Step 5: Delete catch-all + CRA App**

```bash
git rm -r "src/app/[[...slug]]" src/App.tsx src/App.css src/components/Body src/components/ScrollToTop.tsx
```

- [ ] **Step 6: Add `'use client'` to interactive components**

Add `"use client";` as the first line of each (if not already present):
`src/components/About/About.tsx`, `Resume/Resume.tsx`, `Squircle/Squircle.tsx`, `SquircleImage/SquircleImage.tsx`, `SocialMediaIcons/SocialMediaIcons.tsx`, `HeaderLinks/HeaderLinks.tsx`, `ThemeButton/ThemeButton.tsx`, `Header/Header.tsx`.

- [ ] **Step 7: Commit** (build will still fail — Header uses MUI v4 imports until R4)

```bash
git add -A
git commit -m "feat: Redux Providers + AppShell, real / route, delete catch-all"
```

---

### Task R3: Static image import for the profile photo

**Files:** `src/components/About/About.tsx`

- [ ] **Step 1: Change the photo `src`**

In `About.tsx`, the `<SquircleImage src={Ethan} ... />` — change to `src={Ethan.src}` (Next static import returns an object). Everything else unchanged.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "fix: profile photo uses next static import .src"
```

---

### Task R4: Header — MUI v5, no react-router, makeStyles → sx

**Files:** `src/components/Header/Header.tsx`

**Interfaces:** consumes `useRouter` from `next/navigation`; `styled`, `useTheme` from `@mui/material/styles`.

- [ ] **Step 1: Replace the entire file**

```tsx
"use client";

import React from "react";
import "./Header.css";
import HeaderLinks from "../HeaderLinks";
import Squircle from "../Squircle";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InfoIcon from "@mui/icons-material/Info";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import ThemeButton from "../ThemeButton";

const title = "E.H.K.";
const links = ["About", "Schedule"];
const drawerWidth = 240;
const breakpoint = 800;

export default function Header() {
  const theme = useTheme();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => setMobileOpen((v) => !v);

  const handleDrawerButtonClick = (index: number) => {
    handleDrawerToggle();
    router.push(index % 2 === 0 ? "/" : "/schedule");
  };

  const drawer = (
    <div>
      <Box
        sx={(t) => ({
          display: "flex",
          alignItems: "center",
          px: 2,
          ...t.mixins.toolbar,
          justifyContent: "flex-start",
          height: "var(--header-height)",
        })}
      >
        <Link href="/">
          <h4 className="main-heading">{title}</h4>
        </Link>
      </Box>

      <Divider sx={{ backgroundColor: "var(--divider-color)" }} />
      <List>
        {links.map((text, index) => (
          <ListItemButton
            key={text}
            onClick={() => handleDrawerButtonClick(index)}
          >
            <ListItemIcon sx={{ color: "var(--large-heading-color)" }}>
              {index % 2 === 0 ? <InfoIcon /> : <CalendarTodayIcon />}
            </ListItemIcon>
            <ListItemText
              primary={text}
              sx={{ color: "var(--large-heading-color)" }}
            />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ backgroundColor: "var(--divider-color)" }} />
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
        <ThemeButton />
      </Box>
    </div>
  );

  return (
    <Squircle className="header-container">
      <Link href="/" className="main-heading-link">
        <h4 className="main-heading">{title}</h4>
      </Link>
      <div className="links-container">
        <HeaderLinks />
      </div>
      <IconButton
        color="inherit"
        aria-label="open drawer"
        onClick={handleDrawerToggle}
        sx={(t) => ({
          [t.breakpoints.up(breakpoint)]: { display: "none" },
          color: "var(--large-heading-color)",
          height: "22px",
          width: "22px",
        })}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        variant="temporary"
        anchor={theme.direction === "rtl" ? "right" : "left"}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: {
              width: drawerWidth,
              backgroundColor: "var(--background-overlay)",
            },
          },
        }}
      >
        {drawer}
      </Drawer>
    </Squircle>
  );
}
```

Notes:
- `Hidden` (removed in v5) is gone — the menu button's `sx` breakpoint hides it ≥ 800px; the closed `<Drawer>` renders nothing anyway.
- `ListItem button` → `ListItemButton` (v5 API).
- `container` prop dropped (was for SSR/tests; client-only now).
- `fa500px` unused import removed.
- If the installed `@mui/material` is < 5.14, `slotProps.paper` isn't supported — use `PaperProps={{ sx: {...} }}` instead. Check `node_modules/@mui/material/package.json` version.

- [ ] **Step 2: Commit**

```bash
git add src/components/Header/Header.tsx
git commit -m "feat: Header on MUI v5, next/navigation, sx styles"
```

---

### Task R5: MUI Emotion SSR cache provider

**Files:** Create `src/providers/MuiProvider.tsx`; Modify `src/app/layout.tsx`

**Interfaces:** `MuiProvider` — `'use client'` default export, `{ children }`.

- [ ] **Step 1: Create `src/providers/MuiProvider.tsx`**

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
      const prev = inserted;
      inserted = [];
      return prev;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = "";
    for (const name of names) styles += cache.inserted[name];
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

- [ ] **Step 2: Nest in `layout.tsx`**

```tsx
import MuiProvider from "../providers/MuiProvider";

<Providers>
  <MuiProvider>
    <AppShell>{children}</AppShell>
  </MuiProvider>
</Providers>
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: MUI Emotion SSR cache provider"
```

---

### Task R6: antd v5 — ThemeButton, registry, Switch fidelity

**Files:** Rewrite `src/components/ThemeButton/ThemeButton.tsx`; delete `ThemeButton.css`; modify `layout.tsx`

- [ ] **Step 1: Delete the vendored CSS**

```bash
git rm src/components/ThemeButton/ThemeButton.css
```

- [ ] **Step 2: Rewrite `ThemeButton.tsx`**

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
    if (isDarkMode) document.body.classList.add("dark-mode");
    else document.body.classList.remove("dark-mode");
  }, [isDarkMode]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Switch: {
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
        onChange={() => dispatch({ type: "TOGGLE_DARK_MODE" })}
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

- [ ] **Step 3: Add `<AntdRegistry>` to `layout.tsx`**

```tsx
import { AntdRegistry } from "@ant-design/nextjs-registry";

<Providers>
  <MuiProvider>
    <AntdRegistry>
      <AppShell>{children}</AppShell>
    </AntdRegistry>
  </MuiProvider>
</Providers>
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: antd v5 ThemeButton, Switch pinned to v4 look, AntdRegistry"
```

---

### Task R7: HeaderLinks + Schedule + zoom + not-found routes

**Files:** Rewrite `HeaderLinks.tsx`; create `ScheduleClient.tsx`, `app/schedule/page.tsx`, `app/zoom/route.ts`, `app/not-found.tsx`; modify `Schedule.tsx`

- [ ] **Step 1: Rewrite `src/components/HeaderLinks/HeaderLinks.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./HeaderLinks.css";
import ThemeButton from "../ThemeButton";

export default function HeaderLinks() {
  const pathname = usePathname();
  const cls = (href: string) =>
    `header-link-container${pathname === href ? " active-link" : ""}`;

  return (
    <div className="header-links-container">
      <Link href="/" className={cls("/")}>
        <h4 className="header-link">About</h4>
      </Link>
      <Link href="/schedule" className={cls("/schedule")}>
        <h4 className="header-link">Schedule</h4>
      </Link>
      <ThemeButton />
    </div>
  );
}
```

- [ ] **Step 2: `Schedule.tsx` — add `'use client'`** as first line (uses `useDispatch` + `react-calendly`). Keep the `EDIT_IMAGE_LOADED` dispatch.

- [ ] **Step 3: Create `src/components/Schedule/ScheduleClient.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";

const Schedule = dynamic(() => import("./Schedule"), { ssr: false });

export default function ScheduleClient() {
  return <Schedule />;
}
```

- [ ] **Step 4: Create `src/app/schedule/page.tsx`**

```tsx
import ScheduleClient from "../../components/Schedule/ScheduleClient";

export default function Page() {
  return <ScheduleClient />;
}
```

- [ ] **Step 5: Create `src/app/zoom/route.ts`**

```ts
import { NextResponse } from "next/server";
import { ZOOM } from "../../constants";

export function GET() {
  return NextResponse.redirect(ZOOM, 307);
}
```

- [ ] **Step 6: Create `src/app/not-found.tsx`**

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

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: HeaderLinks next/link, /schedule /zoom /404 routes"
```

---

### Task R8: First real render — dev server + browser

**Files:** none (verification + fixes)

- [ ] **Step 1: Start dev server**

```bash
npx next dev -p 3002
```

Wait for Ready. Open `http://localhost:3002`.

- [ ] **Step 2: Fix render errors one at a time**

Expected possible issues and fixes:
- **`window is not defined`** in some component at module scope → guard with `typeof window !== "undefined"`.
- **`corner-smoothing` / `ResizeObserver`** SSR error → ensure `Squircle.tsx` and `SquircleImage.tsx` have `'use client'` (done in R2). If it still errors on the server, wrap the Squircle usage in a `dynamic(ssr:false)` boundary or add a mounted-guard.
- **Hydration mismatch** on the `dark-mode` body class → expected until R9 (pre-paint script); not a blocker now.
- **antd `Switch` "static function can not consume context"** → the `ConfigProvider` wrapping fixes it; ensure `AntdRegistry` is in the tree.

Iterate: reload, read the error overlay + `grep -iE "error|⨯" <devserver log>`, fix, reload. Do NOT proceed until `/` renders the full homepage.

- [ ] **Step 3: Check `/schedule` and `/zoom`**

`http://localhost:3002/schedule` → Calendly. `http://localhost:3002/zoom` → redirects to Zoom. `http://localhost:3002/x` → not-found.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: SSR/render errors on first real Next render"
```

---

### Task R9: Dark-mode pre-paint script + drop ignoreBuildErrors + next/font

**Files:** `src/app/layout.tsx`, `next.config.ts`

- [ ] **Step 1: Confirm persisted shape**

Dev server running, dark mode on, browser console: `JSON.parse(localStorage.getItem("persist:root"))`. Confirm `colorTheme` is a JSON string like `"{\"darkMode\":true,...}"`. Record here: `_______`.

- [ ] **Step 2: Add the pre-paint script to `layout.tsx` `<head>`** (first child of `<head>`)

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `try{var r=localStorage.getItem('persist:root');if(r){var t=JSON.parse(JSON.parse(r).colorTheme||'{}');if(t&&t.darkMode)document.documentElement.classList.add('dark-mode-preload');}}catch(e){}`,
  }}
/>
```

Then in `globals.css` add: `html.dark-mode-preload body { /* nothing needed if ThemeButton effect runs fast; but to be safe: */ }` — actually simpler: have the script target `document.body` directly. Test which works (body may not exist yet when script runs in `<head>`). If body is null, keep `documentElement` + add to `globals.css`:

```css
html.dark-mode-preload body:not(.dark-mode) {
  /* fallback: apply the dark tokens by aliasing */
}
```

Simplest robust approach: put the script at the **very start of `<body>`** instead of `<head>`, targeting `document.body.classList.add('dark-mode')`. Next allows a `<script>` as the first child of `<body>` in the layout.

- [ ] **Step 3: Verify no flash**

Dev server. Dark mode. Hard reload (Cmd+Shift+R). No white flash. Toggle to light, hard reload. No dark flash.

- [ ] **Step 4: next/font for Poppins**

In `layout.tsx`:

```tsx
import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
  style: ["normal","italic"],
  display: "swap",
});
```

Apply: `<body className={poppins.className}>`. Remove the Poppins + preconnect `<link>` tags from `<head>`. In `globals.css` change `body { font-family: "Poppins", sans-serif; }` → keep as-is (next/font registers the `Poppins` family name).

- [ ] **Step 5: Remove `typescript.ignoreBuildErrors` from `next.config.ts`**

Now that `App.tsx` / `Body/` / `ScrollToTop` / react-router are gone, TS should pass. Delete the `typescript: { ignoreBuildErrors: true }` block.

- [ ] **Step 6: `npm run build`**

Expected: **zero errors**. Fix any real TS errors (likely `any` in `SquircleImage` props, MUI `sx` callback types). If `corner-smoothing` has no types, add `src/types/corner-smoothing.d.ts` with `declare module "corner-smoothing";` (there may already be one at `src/typings/index.d.ts` — check).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: dark-mode pre-paint script, next/font Poppins, strict build"
```

---

### Task R10: Analytics + metadata files + cleanup

**Files:** `layout.tsx`, new `app/*.png`, `constants.tsx`

- [ ] **Step 1: Metadata image files**

```bash
cp public/favicon-32x32.png src/app/icon.png
cp public/apple-touch-icon.png src/app/apple-icon.png
cp public/ogImage.png src/app/opengraph-image.png
```

- [ ] **Step 2: `layout.tsx` metadata + analytics**

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://ethank.tech"),
  title: "Ethan Keshishian",
  description: "Ethan Keshishian",
};
```

Remove the manual `openGraph.images` and the Material Icons `<link>` (MUI icons are SVG now). At end of `<body>`:

```tsx
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
// ...
<Analytics />
{process.env.NEXT_PUBLIC_GA_ID && (
  <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
)}
```

- [ ] **Step 3: Trim `constants.tsx`**

If `buttonType` / `linkType` are now unused (grep `src/`), remove them. Keep the `*_LINK`, `CALENDLY`, `ZOOM` constants.

- [ ] **Step 4: Grep for stragglers**

```bash
grep -rn "react-router\|@material-ui\|react-ga\|react-scripts\|makeStyles\|ReactComponent\|useHistory\|BrowserRouter" src/
```

Expected: zero.

- [ ] **Step 5: `npm run build && npm run lint`**

Zero build errors. Address real lint warnings (`<img>` could be `<Image>` — leave for now; missing `key` in Resume `.map()` — fix if quick).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Vercel Analytics + GA4, file-based metadata, cleanup"
```

---

### Task R11: Full browser verification vs production

**Files:** none

- [ ] **Step 1: `npm run build && npm run start`** (production mode — SSR caches active). Open `http://localhost:3000` (or `-p`).

- [ ] **Step 2: Side-by-side with `https://ethank.tech`** — check each, light + dark:
  - Hero bio card: photo (squircle + shadow), "Hi, I'm Ethan.", tagline, bio + Unicorner link, social icons LinkedIn/X/GitHub/Email/Instagram/Spotify
  - Header: E.H.K. logo, About/Schedule links + hover underline, active underline on current route, theme toggle
  - Resume card (Education/Experience), PROJECTS blurred heading, project cards + hover
  - Gradient background animation
  - Squircle corners on header + photo + project cards
  - Fonts: OfficeCodePro, NimbusSanL, Poppins
  - `imageLoaded` fade-in on load

- [ ] **Step 3: Theme toggle** — screenshot-compare in 5 states (light/unchecked, dark/checked, hover, active-press, focus). If materially different, tune `ConfigProvider` tokens in `ThemeButton.tsx`. If unfixable, STOP → get approval for styled-`<button>` fallback.

- [ ] **Step 4: Mobile drawer** (< 800px) — hamburger appears, links hidden; open → drawer from left with E.H.K., About (Info icon), Schedule (Calendar icon), divider, theme toggle at bottom; click About → navigates + closes. Screenshot-compare.

- [ ] **Step 5: Routes** — `/schedule` (nav + direct URL), `/zoom` (307, no white flash), `/nonsense` (not-found).

- [ ] **Step 6: No hydration warnings** in console on `/` and `/schedule`. `view-source:` shows real markup + `<head>` metadata.

- [ ] **Step 7: Dark-mode reload** — hard reload in dark, no white flash. Persists across reload.

- [ ] **Step 8: Record results** in this file. Commit.

```bash
git add docs/superpowers/plans/2026-08-31-cra-to-nextjs-migration.md
git commit -m "docs: migration verification results"
```

---

### Task R12: Vercel + merge + DNS cutover

**Files:** `README.md`; later `firebase.json`, `.firebaserc`, `.firebase/`

- [ ] **Step 1: Push branch**

```bash
git push -u origin cra-to-nextjs
```

- [ ] **Step 2: User — Vercel setup**
  1. Import repo at vercel.com (Next.js auto-detected). `.npmrc` `legacy-peer-deps` makes install work.
  2. `cra-to-nextjs` gets a preview URL. Repeat Task R11 checks against it. Run Lighthouse — SEO/perf not regressed vs prod.
  3. Set `NEXT_PUBLIC_GA_ID` env var (Production + Preview) when the GA4 property exists.

- [ ] **Step 3: User decision — merge**

```bash
git checkout master && git merge --no-ff cra-to-nextjs && git push
```

- [ ] **Step 4: User — DNS cutover**
  1. Vercel → project → Domains → add `ethank.tech` (+ `www` if used).
  2. Lower Firebase DNS TTL, wait, then point A/CNAME at Vercel per Vercel's instructions.
  3. Wait for "Valid Configuration" + HTTPS. Verify `https://ethank.tech` serves the new site.

- [ ] **Step 5: Soak ~1 week.** Check Vercel Analytics + GA4. Test real mobile Safari + Firefox (corner-smoothing / backdrop-filter history).

- [ ] **Step 6: Firebase teardown** (new branch after soak)

```bash
git checkout -b remove-firebase
git rm firebase.json .firebaserc
git rm -r .firebase
npm uninstall firebase-tools
```

Rewrite README "Notes on deployment":

```markdown
## Deployment

Hosted on Vercel. Every push to `master` deploys production; every branch gets a preview URL. No manual deploy step.

Local: `npm run dev`. Build check: `npm run build && npm run start`.
```

```bash
git add -A && git commit -m "chore: remove Firebase Hosting, Vercel is deploy target"
```

- [ ] **Step 7: Record cutover results in this file. Commit.**

---

## Self-Review (revised)

**Spec coverage:** §4 routing → R2/R4/R7; §5a Redux → R2; §5b pre-paint → R9; §5c gate+AppShell → R2; §6a fonts → done + R9; §6b photo → R3, og → R10; §6c SVG → done; §6d logos → done; §7a MUI → R1/R4/R5; §7b antd → R1/R6; §8 analytics → done + R10; §9 deps → R1/R10; §10 Vercel → R12; §11 verify → R8/R11; §12 risks → R8 (the MUI/React19 risk already materialized and is handled by doing v5 upfront).

**No placeholders** except R9 Step 1 (record persisted shape — a verify-then-write instruction with a working default) and R12 (user actions).

**Type consistency:** `Providers`/`MuiProvider`/`AppShell` — default exports, `{ children }`. `MoonIcon`/`SunIcon` — named, `{ className? }`. `ScheduleClient` — default. Action strings `EDIT_IMAGE_LOADED`/`TOGGLE_DARK_MODE` unchanged. Consistent.

---

## Execution log

- Tasks 1–7 (original plan): done, commits `cf20ecc`..`a2db97e`.
- `9d5c598`: hit React 19 / MUI v4 `findDOMNode` incompatibility → plan revised to single pass.

### R11 verification results (2026-09-01, local production build)

Verified on `npm run build && npx next start` vs `https://ethank.tech`:

- ✅ Homepage light + dark — matches prod (tagline, bio, Unicorner link, social icon order)
- ✅ Header logo/links, active underline, hover animation
- ✅ Resume (Education/Experience) + blurred PROJECTS heading + project cards
- ✅ Dark-mode toggle works; Switch colors match prod (black track in light, white/`--large-heading-color` in dark) after `!important` override of antd v5 CSS-in-JS
- ✅ No white flash on dark-mode hard reload (pre-paint `html.theme-dark` script; cleared by AppShell on toggle)
- ✅ `/schedule` — Calendly loads via header nav and mobile drawer
- ✅ `/zoom` — 307 redirect
- ✅ Mobile drawer (MUI v5) — E.H.K. / About (Info) / Schedule (Calendar) / theme toggle pinned bottom; drawer nav via `router.push` closes the drawer
- ✅ Fonts (OfficeCodePro, NimbusSanL, Poppins via next/font), squircle corners, gradient background
- ✅ `next build` — zero errors; zero hydration warnings / console errors in prod

**Deviations from the "port as-is" spec, all functionally equivalent:**
- `imageLoaded` reveal + dark-mode body class moved from leaf components (`SquircleImage`/`ThemeButton`) into `AppShell` — leaf `useEffect`s under the deep antd/MUI provider tree + React 19 StrictMode did not fire reliably. `AppShell` (direct provider child) runs effects fine. User-visible behavior (fade-in on load, theme sync) is unchanged.
- `react-redux` 7→9, `redux` 4→5 (required for React 19 types).
- `next.config.ts` briefly carried `typescript.ignoreBuildErrors` during the codemod phase; removed in R9 — build is now strict.
