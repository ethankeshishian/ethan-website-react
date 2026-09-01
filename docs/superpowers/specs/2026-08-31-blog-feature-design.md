# Blog Feature — Design Spec

**Date:** 2026-08-31
**Status:** Approved for implementation planning
**Project:** 2 of 2 (Project 1 = the CRA → Next.js migration, already merged to `master` and deployed to Vercel)

---

## 1. Goal

Add a blog to `ethank.tech`. The home page (`/`) becomes the blog: the existing bio card, then a list of posts below it. The current home page content (bio + resume + projects) moves to `/about`. Individual posts live at `/blog/[slug]` in a resume-card-style container. Posts are local markdown files. Everything is statically generated with full SEO (sitemap, RSS, per-post OG images, JSON-LD).

Built on the freshly-migrated Next.js 16 / App Router / React 19 site.

### Non-goals

- No CMS, no comments, no tags/categories, no pagination (a flat reverse-chronological list is fine for now).
- No search.
- No RSS/Atom **library** — a hand-rolled route handler.
- No redesign of the bio card, resume, or projects sections — they move, they don't change.
- No reading-time estimate.
- The blog list on `/` does **not** get the resume's slide-up overlap animation — it sits in normal flow.

---

## 2. Routes

| Route | Renders | Notes |
|---|---|---|
| `/` | `<BioHero />` + `<BlogList />` inside `.main-container` | Home = the blog. Gradient background (as today). |
| `/about` | `<BioHero />` + `<Resume />` inside `.main-container` | Exactly today's `/` content, including the resume slide-up overlap. |
| `/blog` | `<BlogList />` standalone | No bio card. Top padding to clear the fixed header. |
| `/blog/[slug]` | The post page | SSG, `dynamicParams = false`. |
| `/schedule` | unchanged | |
| `/zoom` | unchanged (307 redirect) | |
| `/sitemap.xml` | `app/sitemap.ts` | |
| `/feed.xml` | `app/feed.xml/route.ts` (RSS) | `dynamic = 'force-static'` |
| `/blog/[slug]/opengraph-image` | `app/blog/[slug]/opengraph-image.tsx` (`ImageResponse`) | Per-post OG image, prerendered. |

### Header nav

`Home` / `About` / `Schedule` (replacing today's `About` / `Schedule`). The E.H.K. logo links to `/`. `Home` is the active link on `/`, `/blog`, and `/blog/*`. `About` active on `/about`. `Schedule` active on `/schedule`.

`HeaderLinks.tsx` currently maps `pathname === href` for the active class. The `Home` link needs `pathname === "/" || pathname.startsWith("/blog")`.

---

## 3. Content model

### File layout

```
src/content/blog/
  the-underdog-story-of-acme.md
  why-late-stage-founders-hustle.md
  images live in  public/blog/*
```

Filename = the slug, no date prefix. `date` frontmatter handles ordering.

### Frontmatter (YAML)

```md
---
title: "The underdog story of Acme"
subtitle: "How a two-person team out-shipped a Series B"
date: 2026-09-01
draft: false
---

## Body starts here

Markdown / GFM. Fenced code blocks, images (`/blog/foo.png`), links, lists,
blockquotes.
```

| Field | Required | Type | Use |
|---|---|---|---|
| `title` | yes | string | list card, post `<h1>`, `<title>`, OG, RSS, JSON-LD |
| `subtitle` | no | string | list card, post subtitle, meta `description`, RSS `description` |
| `date` | yes | `YYYY-MM-DD` | display, sort (desc), sitemap `lastModified`, RSS `pubDate`, JSON-LD `datePublished` |
| `draft` | no (default `false`) | boolean | when `true`: excluded from the list, sitemap, RSS, and `generateStaticParams` **in production only**. Still builds and is viewable at its URL under `next dev`. |

### Slug

Slug = the filename minus the `.md` extension, verbatim. No prefix stripping, no
derivation from the title, nothing appended.
`the-underdog-story-of-acme.md` → slug `the-underdog-story-of-acme` → URL `/blog/the-underdog-story-of-acme`.

Authoring convention: name the file as a slugified post title (lowercase,
words separated by hyphens). The build does not slugify or validate — the
filename *is* the slug. `posts.ts` sorts by `date` frontmatter, not filename.

### `src/lib/posts.ts` — the posts library (server-only)

```ts
import 'server-only';

export type PostMeta = {
  slug: string;       // = filename without ".md"
  title: string;
  subtitle?: string;
  date: string;       // ISO "YYYY-MM-DD"
  draft: boolean;
};

// Reverse-chronological by `date`. Drafts filtered when NODE_ENV === 'production'
// unless { includeDrafts: true }.
export function getAllPosts(opts?: { includeDrafts?: boolean }): PostMeta[];

// slugs for generateStaticParams (respects the same draft rule).
export function getPostSlugs(opts?: { includeDrafts?: boolean }): string[];

// throws if the slug has no matching file (used to fail fast in the page).
export function assertPostExists(slug: string): void;
```

Implementation: `fs.readdirSync('src/content/blog')` → keep `*.md` → for each, read the file, `matter()` the frontmatter (body is compiled separately by `@next/mdx`), `slug = filename.replace(/\.md$/, '')`, coerce `draft` to boolean, sort by `date` descending. Filter `p.draft && process.env.NODE_ENV === 'production'` unless `includeDrafts`.

Since `slug === filename` (minus `.md`), the post page imports directly: `import(\`@/content/blog/${slug}.md\`)` — no slug→filename lookup needed.

`getAllPosts` is called during `next build` (server components, `generateStaticParams`, `sitemap.ts`, the RSS route) — never in a client component.

---

## 4. Markdown pipeline

### Packages

Runtime: `@mdx-js/react` (tiny — the components context).
Build: `@next/mdx`, `@mdx-js/loader`, `@types/mdx`, `gray-matter`, `remark-gfm`, `rehype-pretty-code`, `shiki` (peer of rehype-pretty-code), `rehype-slug`.

### `next.config.ts`

```ts
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,          // compile .md too, not just .mdx
  options: {
    remarkPlugins: ['remark-gfm'],   // strings — Turbopack requires serializable plugin refs
    rehypePlugins: [
      ['rehype-pretty-code', { theme: { light: 'github-light', dark: 'github-dark' }, keepBackground: true }],
      'rehype-slug',
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: __dirname },
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],   // per @next/mdx docs; no .md in app/, harmless
};

export default withMDX(nextConfig);
```

Turbopack constraint (already known from the migration): remark/rehype plugins must be passed **as strings** (or `[string, options]`), never as imported functions — JS functions can't cross the Rust boundary.

### `src/mdx-components.tsx` (required for `@next/mdx` + App Router)

Located in `src/` (this repo uses `src/`). Exports `useMDXComponents()` returning a `components` map. This is where **all prose styling** is defined — element → styled component. See §6 for the exact styles. It also maps `img` → the `next/image` wrapper (§4, Images).

### Rendering a post

`app/blog/[slug]/page.tsx`:

```tsx
assertPostExists(slug);
const { default: Post } = await import(`@/content/blog/${slug}.md`);
// ...render <Post /> inside the container
```

The template-literal `import()` with the static `@/content/blog/` prefix + `.md` suffix lets the bundler lazily glob that directory. (Fallback if Turbopack can't analyze it: a generated slug→import map in `posts.ts`.)

### Frontmatter: `gray-matter`, not `remark-mdx-frontmatter`

The list / sitemap / RSS need metadata **without** compiling MDX. `gray-matter` reads only the YAML block. The post page pulls its own metadata from `getAllPosts({ includeDrafts: true }).find(p => p.slug === slug)` — one source of truth, no dependency on the compiled module's exports.

### Images

Live in `public/blog/`, referenced in markdown as `/blog/foo.png`.
`mdx-components.tsx` maps `img` → a wrapper:

```tsx
img: (props) => (
  <Image
    src={props.src}
    alt={props.alt ?? ''}
    width={1600}
    height={900}
    sizes="(max-width: 800px) 100vw, 736px"
    style={{ width: '100%', height: 'auto', borderRadius: 8, cornerShape: 'superellipse(2.2)', margin: '1.6em 0' }}
  />
)
```

The nominal `1600×900` + `height: auto` override means the image scales to its container without distortion regardless of true aspect ratio. A post needing exact control uses an MDX component instead of `![]()`.

### Code blocks — light/dark

`rehype-pretty-code` with `theme: { light, dark }` emits both variants in the DOM with `data-theme` attributes. The site's theme signal is `body.dark-mode`. Wire in `globals.css` (or the post stylesheet):

```css
body:not(.dark-mode) [data-theme='dark'] { display: none; }
body.dark-mode        [data-theme='light'] { display: none; }
```

(Applies to both `pre[data-theme]` and inline `code[data-theme]`.)

---

## 5. Components & file structure

### Created

| File | Responsibility |
|---|---|
| `src/lib/posts.ts` | posts library (§3) — server-only |
| `src/mdx-components.tsx` | MDX element → styled component map (§6) |
| `src/components/BioHero/BioHero.tsx` | the bio card, extracted from `About.tsx` (`'use client'` — uses `imageLoaded` selector for the fade) |
| `src/components/BioHero/BioHero.css` | the `About.css` rules for the hero (see "Moved" below) |
| `src/components/BlogList/BlogList.tsx` | `BLOG` heading + stacked post cards (server component) |
| `src/components/BlogList/BlogList.css` | list + card styles (§6) |
| `src/components/BlogPost/BlogPost.tsx` | the post container: back link, title, subtitle, date, divider, `{children}` slot, JSON-LD |
| `src/components/BlogPost/BlogPost.css` | container + prose styles (§6) |
| `src/app/about/page.tsx` | `<BioHero/>` + `<Resume/>`, `metadata` |
| `src/app/blog/page.tsx` | `<BlogList/>`, `metadata` |
| `src/app/blog/[slug]/page.tsx` | SSG post page: `generateStaticParams`, `dynamicParams = false`, `generateMetadata`, dynamic MDX import, renders `<BlogPost>` |
| `src/app/blog/[slug]/opengraph-image.tsx` | per-post OG image via `ImageResponse` |
| `src/app/sitemap.ts` | sitemap |
| `src/app/feed.xml/route.ts` | RSS (`GET`, `force-static`) |
| `src/content/blog/example-post.md` | one starter post so the feature has content to render |
| `public/blog/` | post images directory (created, may start empty) |

### Modified

| File | Change |
|---|---|
| `next.config.ts` | `withMDX(...)` wrapper, `pageExtensions` (§4) |
| `src/app/page.tsx` | now renders `.main-container` > `<BioHero/>` + `<BlogList/>` |
| `src/app/layout.tsx` | move the font-awesome `<link>` here from `About.tsx`; add `<link rel="alternate" type="application/rss+xml" href="/feed.xml">` |
| `src/components/HeaderLinks/HeaderLinks.tsx` | add `Home` link; `Home` active on `/` + `/blog*` |
| `src/components/Header/Header.tsx` | mobile drawer: 3 items (Home/About/Schedule); the `index % 2` route hack becomes an explicit `["/", "/about", "/schedule"]` map |
| `src/components/Resume/Resume.tsx` | `className="project-section-title"` → `"blurred-section-title"` (the PROJECTS heading) |
| `src/components/Resume/Resume.css` | rename `.project-section-title` → shared `.blurred-section-title` (used by both `PROJECTS` in `Resume.tsx` and `BLOG` in `BlogList.tsx`); add `.blog-card-header` / `.blog-card-subtitle` to the shared `.project-card-header` / `.project-subtitle` selector lists |
| `src/app/globals.css` | `.main-container` + `@keyframes gradient` move here from `About.css`; the code-block `[data-theme]` show/hide rules |
| `package.json` | MDX deps (§4) |

### Deleted

`src/components/About/` (whole directory — `About.tsx` + `About.css` + `index.tsx`). Its markup splits into `BioHero.tsx` + `app/about/page.tsx`; its CSS splits into `BioHero.css` + `globals.css`.

### Moved (`About.css` → where)

| Rules | Destination |
|---|---|
| `.main-container`, `@keyframes gradient` | `globals.css` |
| `.hero-container`, `.about-container-wrapper`, `.about-container`, `.image-*`, `.text-container`, `.text-content-container`, `.link`, `.link::after`, `.link-container:hover/focus`, `.title`, `.tagline`, `.bio`, `.fade-1..4`, `@keyframes fade`, `@keyframes translate`, and all the `@media` blocks for those | `BioHero.css` |
| `.articles-container`, `.slide`, `@keyframes slide`, the `@media (max-width:1310px)` `.slide`/`.about-container` grid rules | stays in `Resume.css` **or** a new `about.css` imported by `app/about/page.tsx` — whichever keeps the resume slide-up overlap byte-identical. The `.articles-container.slide` + `.resume-main-block { margin-top: -100px }` interaction must not change. |

### `BioHero.tsx` structure (from current `About.tsx` lines 18–44)

```tsx
"use client";
export default function BioHero() {
  const imageLoaded = useSelector((s: RootState) => s.readyToLoad.imageLoaded);
  return (
    <div className="hero-container">
      <span className="about-container-wrapper">
        <div className="about-container">
          <div className="image-section-container">
            <div className="image-container">
              <SquircleImage src={Ethan.src} alt="Ethan Keshishian" />
            </div>
          </div>
          <div className="text-container">
            <div className="text-content-container">
              <h2 className={imageLoaded ? "title fade-1" : "title"}>Hi, I'm Ethan.</h2>
              <p className={imageLoaded ? "tagline fade-2" : "tagline"}>I'm the Startup Storyteller.</p>
              <p className={imageLoaded ? "bio fade-3" : "bio"}>
                I'm a software engineer at Mercury, and one of the co-founders of{" "}
                <a className="link-container" href={UNICORNER_LINK}><span className="link">Unicorner</span></a>
                , the startup community telling the stories of startups and their founders. I hold an MS and BS in CS/AI from UCLA.
              </p>
              <div className={imageLoaded ? "social-icons fade-4" : "social-icons"}>
                <SocialMediaIcons />
              </div>
            </div>
          </div>
        </div>
      </span>
    </div>
  );
}
```

Class names, copy, and fade behavior are **unchanged** from the current `About.tsx`.

### `app/page.tsx` (Home)

```tsx
import BioHero from "@/components/BioHero/BioHero";
import BlogList from "@/components/BlogList/BlogList";

export default function Home() {
  return (
    <main className="main-container">
      <BioHero />
      <BlogList />
    </main>
  );
}
```

### `app/about/page.tsx`

```tsx
import type { Metadata } from "next";
import BioHero from "@/components/BioHero/BioHero";
import Resume from "@/components/Resume";
import "@/app/about.css"; // if the slide rules land in a dedicated file

export const metadata: Metadata = {
  title: "About",
  description: "Ethan Keshishian — software engineer at Mercury, co-founder of Unicorner.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <main className="main-container">
      <BioHero />
      <div className="articles-container slide">
        <Resume />
      </div>
    </main>
  );
}
```

The wrapper nesting here (`.main-container` > `.hero-container`(from BioHero) > `.articles-container.slide` > `Resume`) must match current `About.tsx` so the slide-up overlap animation renders identically. Screenshot-compare `/about` against the currently-live `/` during verification.

---

## 6. Styles

All values below are the site's existing design-system tokens / patterns. New CSS reuses `--resume-background`, `--resume-backdrop-filter`, `--drop-shadow-*`, `--large-heading-color`, `--sub-text-color`, `--text-color`, `--accent-color`, `--divider-color`, and the `border-radius: 8px; corner-shape: superellipse(2.2)` glassy-card pattern shipped in the migration.

### 6a. Shared blurred section title

Factor the current `.project-section-title` into `.blurred-section-title` (in `Resume.css` or `globals.css`), applied to both `PROJECTS` and `BLOG`:

```css
.blurred-section-title {
  color: var(--large-heading-color);
  align-self: center;
  padding-top: 120px;
  margin-bottom: clamp(16px, 4vw, 32px);
  font-size: 96px;
  letter-spacing: -0.75rem;
  text-transform: uppercase;
  font-weight: 400;
  filter: blur(4px);
  font-style: italic;
  transform: scale(2, 1);
}
@media screen and (max-width: 899px) {
  .blurred-section-title { font-size: 64px; letter-spacing: -0.5rem; filter: blur(3px); }
}
@media screen and (max-width: 599px) {
  .blurred-section-title { font-size: 32px; letter-spacing: -0.2rem; filter: blur(2px); }
}
```

`Resume.tsx` uses `className="blurred-section-title"` for PROJECTS; `BlogList.tsx` uses it for BLOG.

### 6b. `BlogList` (`.blog-section`, `.blog-cards-container`, `.blog-card*`)

```css
.blog-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.blog-cards-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: min(1024px, 100%);
  width: 100%;
  margin: 0 auto;
  padding: 0 clamp(16px, 5vw, 64px);
  box-sizing: border-box;
  list-style: none;
}
.blog-card-wrapper {
  display: flex;
  flex-direction: column;
  filter: var(--drop-shadow-xs);
  transition: 0.4s;
  backdrop-filter: var(--resume-backdrop-filter);
  border-radius: 8px;
  corner-shape: superellipse(2.2);
}
.blog-card-wrapper:hover {
  transform: translateY(-12px);
  filter: var(--drop-shadow-s);
}
.blog-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: clamp(32px, 4vw, 48px);
  background-color: var(--resume-background);
  border: 1px solid var(--resume-background);
  border-radius: 8px;
  corner-shape: superellipse(2.2);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}
.blog-card-date {
  font-size: clamp(12px, 3vw, 14px);
  font-weight: 300;
  color: var(--sub-text-color);
  margin-top: 4px;
}
```

`.blog-card-header` is added to the `.project-card-header` selector list (font-size `clamp(16px, 3vw, 24px)`, weight 500, `--large-heading-color`). `.blog-card-subtitle` is added to the `.project-subtitle` list (font-size `clamp(12px, 3vw, 14px)`, weight 300, `--sub-text-color`).

**Empty state:** when `getAllPosts()` is empty, render `<p class="blog-empty">Posts coming soon.</p>` — `color: var(--sub-text-color); font-weight: 300;` centered.

**On `/blog` (standalone):** wrap `<BlogList>` in a `.blog-list-page` with `padding-top: calc(var(--header-height) + 48px)` so it clears the fixed header. On `/` it needs no extra top padding (it follows `<BioHero>` in flow).

### 6c. `BlogPost` (`.blog-list-page` not applicable; `.blog-page`, `.blog-container`, prose)

```css
.blog-page {
  padding: calc(var(--header-height) + 48px) clamp(16px, 5vw, 64px) 96px;
  box-sizing: border-box;
  min-height: 100vh;
}
.blog-container {
  max-width: 768px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 32px);
  box-sizing: border-box;
  background-color: var(--resume-background);
  border: 1px solid var(--resume-background);
  backdrop-filter: var(--resume-backdrop-filter);
  filter: var(--drop-shadow-s);
  border-radius: 8px;
  corner-shape: superellipse(2.2);
  color: var(--text-color);
}
.blog-back {
  display: inline-block;
  margin-bottom: 24px;
  font-size: clamp(12px, 3vw, 14px);
  font-weight: 500;
  color: var(--accent-color);
  text-decoration: none;
}
.blog-back:hover { text-decoration: underline; }
.blog-title {
  color: var(--large-heading-color);
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.0125rem;
  margin: 0 0 8px;
}
.blog-post-subtitle {
  color: var(--sub-text-color);
  font-weight: 300;
  font-size: clamp(16px, 3vw, 20px);
  margin: 0 0 12px;
}
.blog-post-date {
  color: var(--sub-text-color);
  font-weight: 300;
  font-size: clamp(12px, 3vw, 14px);
}
.blog-divider {
  border: 0;
  border-top: 1px solid var(--divider-color);
  margin: 24px 0;
}
```

Note: `.blog-container` uses `filter: var(--drop-shadow-s)` **and** `backdrop-filter` on the same element. The migration established this is safe with `border-radius` (which clips the backdrop-filter rect) — no `clip-path`, so the drop-shadow isn't clipped. Same pattern as `.resume-cards-container`... actually the resume splits filter and backdrop-filter across `.resume-container-wrapper` and `.resume-cards-container`. **For the blog container, split them the same way** to be safe: an outer `.blog-container-shadow { filter: var(--drop-shadow-s); }` and the inner `.blog-container` with `backdrop-filter` + `border-radius` + bg. Match the resume's two-element structure.

### 6d. Prose — via `mdx-components.tsx`, scoped under `.blog-prose`

The MDX body is wrapped in `<div className="blog-prose">`. `mdx-components.tsx` returns styled components; they render plain elements with these styles (or the styles live in `BlogPost.css` under `.blog-prose <el>` and the components map is minimal). Either approach — the styles are:

| Element | Style |
|---|---|
| `p` | `color: var(--text-color); font-weight: 300; font-size: clamp(15px, 2.4vw, 18px); line-height: 1.7; margin: 0 0 1.2em;` |
| `h2` | `color: var(--large-heading-color); font-size: clamp(22px, 3.5vw, 30px); font-weight: 600; line-height: 1.2; letter-spacing: -0.0125rem; margin: 1.8em 0 0.6em;` |
| `h3` | `color: var(--large-heading-color); font-size: clamp(18px, 3vw, 24px); font-weight: 600; margin: 1.6em 0 0.5em;` |
| `h4` | `color: var(--large-heading-color); font-size: clamp(16px, 2.5vw, 20px); font-weight: 600; margin: 1.4em 0 0.4em;` |
| `a` | `color: var(--accent-color); text-decoration: underline; text-underline-offset: 2px;` |
| `ul`, `ol` | `margin: 0 0 1.2em; padding-left: 1.4em; color: var(--text-color); font-weight: 300; font-size: clamp(15px, 2.4vw, 18px); line-height: 1.7;` `li { margin-bottom: 0.4em; }` |
| `blockquote` | `border-left: 3px solid var(--accent-color); padding-left: 1em; margin: 1.4em 0; color: var(--sub-text-color); font-style: italic;` |
| `code` (inline) | `font-family: "OfficeCodePro", ui-monospace, monospace; font-size: 0.9em; background: var(--divider-color); padding: 0.15em 0.4em; border-radius: 4px;` |
| `pre` (block) | `border-radius: 8px; corner-shape: superellipse(2.2); padding: clamp(12px, 3vw, 20px); overflow-x: auto; margin: 1.4em 0; font-size: clamp(12px, 2vw, 14px); line-height: 1.6;` — background comes from `rehype-pretty-code` (`keepBackground: true`), swapped light/dark by the `[data-theme]` rules in §4. |
| `pre code` | reset the inline `code` background/padding to none (rehype-pretty-code styles the tokens). |
| `img` | the `next/image` wrapper (§4). |
| `hr` | `border: 0; border-top: 1px solid var(--divider-color); margin: 2em 0;` |
| `table` | `width: 100%; border-collapse: collapse; margin: 1.4em 0; font-size: clamp(13px, 2vw, 15px);` `th, td { border: 1px solid var(--divider-color); padding: 8px 12px; text-align: left; }` |

Fonts: prose inherits Poppins (`next/font`, set on `<html>`); inline/block code uses `OfficeCodePro` (a local `@font-face` already in `globals.css`).

---

## 7. SEO artifacts

### 7a. `app/sitemap.ts`

```ts
import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";

const BASE = "https://ethank.tech";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.date,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/schedule`, changeFrequency: "yearly", priority: 0.5 },
    ...posts,
  ];
}
```

### 7b. `app/feed.xml/route.ts` — RSS

`GET` handler, `export const dynamic = "force-static"`. Builds RSS 2.0 XML from `getAllPosts()`:

- channel: `title` "Ethan Keshishian", `link` `https://ethank.tech`, `description` "Startup stories and notes.", `language` `en-us`, `atom:link` self-ref to `/feed.xml`
- one `<item>` per post: `<title>` (escaped), `<link>`/`<guid isPermaLink="true">` `https://ethank.tech/blog/{slug}`, `<pubDate>` (RFC-822 from `date`), `<description>` (escaped `subtitle` or `title`)

XML-escape `& < > " '` in all interpolated text. No library — ~40 lines. Return with `headers: { "Content-Type": "application/rss+xml; charset=utf-8" }`.

`layout.tsx` `<head>`: `<link rel="alternate" type="application/rss+xml" title="Ethan Keshishian" href="/feed.xml" />` (or via `metadata` — but the `<link>` is simplest and unambiguous).

### 7c. `app/blog/[slug]/opengraph-image.tsx`

```ts
import { ImageResponse } from "next/og";
import { getAllPosts, getPostSlugs } from "@/lib/posts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getPostSlugs({ includeDrafts: true }).map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getAllPosts({ includeDrafts: true }).find((p) => p.slug === slug);
  return new ImageResponse(
    (
      <div style={{ /* purple gradient bg matching --cover-background, Poppins,
                       post.title large + "Ethan Keshishian" + formatted date small */ }}>
        {/* ... */}
      </div>
    ),
    { ...size }
  );
}
```

Font: fetch the Poppins weights needed (`400`, `700`) as ArrayBuffers via `fetch` from the `next/font` output or a `public/fonts` copy, pass to `ImageResponse` `fonts`. Prerendered (via `generateStaticParams`). The route convention auto-wires `og:image` for `/blog/[slug]` — `generateMetadata` does **not** set `openGraph.images`.

Home / `/about` / `/blog` keep the existing static `src/app/opengraph-image.png`.

### 7d. `generateMetadata` in `app/blog/[slug]/page.tsx`

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const post = getAllPosts({ includeDrafts: true }).find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.subtitle ?? post.title,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.subtitle ?? post.title,
      type: "article",
      publishedTime: post.date,
      url: `/blog/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.subtitle ?? post.title,
    },
  };
}
```

`metadataBase` is already `https://ethank.tech` in `layout.tsx` — relative `url`/`canonical` resolve against it.

### 7e. JSON-LD (in `BlogPost.tsx`)

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.subtitle ?? post.title,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: "Ethan Keshishian", url: "https://ethank.tech/about" },
    url: `https://ethank.tech/blog/${post.slug}`,
    mainEntityOfPage: `https://ethank.tech/blog/${post.slug}`,
  }) }}
/>
```

---

## 8. Verification

No unit tests (consistent with the site). `next build` must pass with zero errors, then browser checks against a local `next build && next start`:

- **`/`** — `<BioHero>` (photo, title, tagline, bio + Unicorner link, social icons, `imageLoaded` fade) then the `BLOG` blurred heading and the post cards. Cards hover-lift. Light + dark. Gradient background animates.
- **`/blog`** — the list standalone, no bio card, top padding clears the header, `Home` nav link is active.
- **`/blog/[slug]`** — 768px glassy container, `← Back to blog` link, `<h1>` title, subtitle, formatted date, divider, then prose. Check: a fenced code block renders highlighted in **both** light and dark; an image renders responsive; a link is accent-colored; `<title>` in the tab is the post title; `<script type="application/ld+json">` is in the HTML.
- **`/about`** — `<BioHero>` + Resume, **with the slide-up overlap animation intact** — screenshot-compare against the currently-live `https://ethank.tech/` (which still shows the old home = this content).
- **Header** — `Home` / `About` / `Schedule`, correct active states on each route including `/blog/*`. Mobile drawer shows the 3 items and navigates correctly.
- **404** — `/blog/does-not-exist` → the not-found page (because `dynamicParams = false`).
- **Drafts** — a post with `draft: true`:
  - `next build`: absent from `/`, `/blog`, `/sitemap.xml`, `/feed.xml`; its `/blog/[slug]` route is **not** generated (404).
  - `next dev`: present in `/` and `/blog`; its page renders.
- **`curl` checks** (against `next start`):
  - `/sitemap.xml` — valid XML, lists `/`, `/about`, `/blog`, `/schedule`, and every non-draft post.
  - `/feed.xml` — valid RSS 2.0, `Content-Type: application/rss+xml`, one item per non-draft post with escaped titles and RFC-822 dates.
  - `/blog/[slug]` — the response body contains the rendered article HTML (headings, paragraphs) — confirms SSG, not a client shell.
  - `/blog/[slug]/opengraph-image` — returns a PNG.
- **Lighthouse** on a post page — SEO ≥ 95.
- **No hydration warnings / console errors** on any route.

---

## 9. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `rehype-pretty-code` + Turbopack: string-plugin requirement, `shiki` build weight | Medium | Pass plugins as strings (known Turbopack constraint from the migration). Shiki is build-time only. Fallback: `rehype-highlight` (highlight.js, lighter, also string-configurable) with a hand-picked CSS theme. |
| Dynamic `import(\`@/content/blog/${slug}.md\`)` not statically analyzable by Turbopack | Medium | The static `@/content/blog/` prefix + `.md` suffix is the pattern Next's own docs show. Fallback: `posts.ts` generates an explicit `{ [slug]: () => import(...) }` map (one static `import()` per file, written by a tiny prebuild step or checked in). |
| `mdx-components.tsx` location | Low | Must be at `src/mdx-components.tsx` (this repo uses `src/`). Build fails loudly if missing/misplaced. |
| `.blog-container` `filter` + `backdrop-filter` on one element (Safari white-line history from the migration/`constants.css` comments) | Medium | Split across two elements exactly like `.resume-container-wrapper` / `.resume-cards-container`. Verify on real Safari + Firefox. |
| `/about` slide-up overlap drifts from today's `/` after the `About.tsx` split | Medium | Keep the wrapper nesting and the `.articles-container.slide` + `.resume-main-block { margin-top: -100px }` rules exactly as-is; screenshot-compare. |
| `ImageResponse` font loading (needs ArrayBuffer, not `next/font` object) | Low | Copy the 2 Poppins weights to `public/fonts/` (they're already there from the migration) and `fetch` them in the OG route. |
| `next/image` for MDX images — `/blog/x.png` from `public/` works with the default loader; relative `./images/x.png` does not | Low | Spec mandates `public/blog/` + absolute `/blog/x.png` paths. Document it in the starter post. |
| Blog list corner-shape on glassy cards (Chrome-only `corner-shape`, Safari/FF fall back to plain radius) | Low | Reuse the shipped-and-verified `.project-card-wrapper` pattern verbatim. Plain rounded corners in Safari/FF are acceptable (same as the rest of the site). |

### Rollback

Branch `blog` is never merged until §8 passes on a Vercel preview. `master` (the migrated site, no blog) is untouched until then. Post-merge, Vercel retains every deployment for instant rollback.

---

## 10. Decision summary

| Area | Decision |
|---|---|
| MD pipeline | `@next/mdx` with `extension: /\.(md\|mdx)$/`; `gray-matter` for frontmatter in `posts.ts`; `remark-gfm` + `rehype-pretty-code` (light/dark) + `rehype-slug`, all as string plugins; `src/mdx-components.tsx` for prose |
| Content | `src/content/blog/<slug>.md`; frontmatter `title` / `subtitle?` / `date` / `draft?`; slug = filename minus `.md`; drafts hidden in prod only; images in `public/blog/` referenced `/blog/x.png` |
| Routes | `/` = BioHero + BlogList; `/about` = BioHero + Resume; `/blog` = BlogList standalone; `/blog/[slug]` = post (`dynamicParams = false`); `/sitemap.xml`; `/feed.xml` |
| Header | Home / About / Schedule; Home active on `/` + `/blog*`; mobile drawer gets an explicit route map |
| Blog list | Individual glassy squircle cards (project-card styling + `translateY(-12px)` hover), single column `max-width: min(1024px, 100%)`, title → subtitle → date; blurred `BLOG` heading via shared `.blurred-section-title`; no slide-up overlap on `/` |
| Post page | 768px glassy container (filter + backdrop-filter split across two elements), `clamp(16px, 4vw, 32px)` padding, `← Back to blog`, title / subtitle / date / divider / `.blog-prose` body; dual light/dark code themes |
| SEO | `sitemap.ts`; hand-rolled RSS route (`force-static`); per-post `opengraph-image.tsx` (`ImageResponse`, prerendered); `BlogPosting` JSON-LD; per-post `generateMetadata` + canonical + `og:type: article` |
| Refactor | `About.tsx` → `BioHero` component + `app/about/page.tsx`; `src/components/About/` deleted; `About.css` split to `BioHero.css` + `globals.css` (+ resume slide rules stay put); gradient background on `/` and `/about` only |
| Deps added | `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx`, `gray-matter`, `remark-gfm`, `rehype-pretty-code`, `shiki`, `rehype-slug` |
