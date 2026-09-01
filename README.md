# ethank.tech

Personal site, built with [Next.js](https://nextjs.org/) (App Router, React 19).

## Development

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build check:

```bash
npm run build && npm run start
```

## Deployment

Hosted on [Vercel](https://vercel.com/). Every push to `master` deploys to
production; every branch / PR gets its own preview URL. There is no manual
deploy step.

Environment variables (set in the Vercel project settings):

- `NEXT_PUBLIC_GA_ID` — GA4 measurement ID (`G-XXXXXXXXXX`). Optional; the site
  works without it (Vercel Analytics still reports).

## Structure

- `src/app/` — routes (`/`, `/schedule`, `/zoom`), root layout, metadata files
- `src/providers/` — `Providers` (Redux), `MuiProvider` (Emotion SSR cache),
  `AppShell` (theme + load-gate + header)
- `src/components/` — UI components
- `src/redux/` — store + reducers (`colorTheme`, `readyToLoad`)
- `public/fonts/`, `public/logos/` — static assets

## Notes

- Dark mode is persisted via `redux-persist` (localStorage) and applied before
  first paint by an inline script in `src/app/layout.tsx`.
- The theme toggle uses antd's `Switch`; its colours are pinned to match the
  design via a `<style jsx global>` override in `ThemeButton.tsx`.
