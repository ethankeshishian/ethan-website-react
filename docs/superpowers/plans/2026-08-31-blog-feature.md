# Blog Feature Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans (or subagent-driven-development). Steps use `- [ ]` checkboxes. Each task ends with a build/browser check and a commit.

**Goal:** Add a blog to `ethank.tech`. `/` becomes the bio card + a list of posts; the current home content (bio + resume + projects) moves to `/about`. Posts are local `.md` files at `/blog/[slug]`, statically generated, with sitemap, RSS, per-post OG images, and JSON-LD.

**Architecture:** `@next/mdx` compiles `src/content/blog/*.md` to static React components. `src/lib/posts.ts` (server-only) reads frontmatter with `gray-matter` for the list / sitemap / RSS / `generateStaticParams`. `About.tsx` is split into a reusable `<BioHero>` component + `app/about/page.tsx`. New components: `<BioHero>`, `<BlogList>`, `<BlogPost>`. All output is static HTML at build time.

**Tech stack:** Next.js 16 (App Router, Turbopack, React 19, TS 5), `@next/mdx` + `@mdx-js/loader` + `@mdx-js/react`, `gray-matter`, `remark-gfm`, `rehype-pretty-code` + `shiki`, `rehype-slug`, `next/og` (ImageResponse). Existing: `@mui/material` v5, Redux, `corner-smoothing`.

**Spec:** `docs/superpowers/specs/2026-08-31-blog-feature-design.md`

## Global Constraints

- **Next.js 16 / App Router / React 19 / TS 5.** All new UI in server components unless it needs hooks; then `'use client'` on the leaf.
- **Turbopack:** remark/rehype plugins passed **as strings** (`'remark-gfm'`, `['rehype-pretty-code', {...}]`) — never imported functions.
- **Slug = filename minus `.md`, verbatim.** `the-underdog-story.md` → slug `the-underdog-story` → `/blog/the-underdog-story`. No prefix stripping, no title-derivation, nothing appended. `posts.ts` sorts by `date` frontmatter.
- **Drafts:** `draft: true` in frontmatter → excluded from the list, sitemap, RSS, and `generateStaticParams` when `process.env.NODE_ENV === 'production'`; still built and viewable under `next dev`.
- **`dynamicParams = false`** on `/blog/[slug]` — unknown slug → 404.
- **`metadataBase` is already `https://ethank.tech`** in `layout.tsx` — relative `url`/`canonical` resolve against it. RSS/sitemap use the literal `https://ethank.tech`.
- **No redesign.** The bio card, resume, and projects sections move but do not change. `/about` must render byte-identical to the currently-live `https://ethank.tech/` (which still shows the old home).
- **Reuse the design system:** `--resume-background`, `--resume-backdrop-filter`, `--drop-shadow-*`, `--large-heading-color`, `--sub-text-color`, `--text-color`, `--accent-color`, `--divider-color`, and the shipped `border-radius: 8px; corner-shape: superellipse(2.2)` glassy-card pattern. Where an element needs both `filter: drop-shadow` and `backdrop-filter`, split them across two elements (as `.resume-container-wrapper` / `.resume-cards-container` do) — never on one element.
- **Branch:** `blog`. Commit after every task. Dev server: `npx next dev` (add `-p 3002` if 3000/3001 taken — a Next project already runs on 3000 on this machine).
- **No unit tests** (consistent with the repo). Verification = `next build` clean + browser + `curl` checks.

---

## File Structure

### Created

| File | Responsibility |
|---|---|
| `src/lib/posts.ts` | posts library — `getAllPosts`, `getPostSlugs`, `assertPostExists`; server-only |
| `src/mdx-components.tsx` | MDX element → styled component map; `img` → `next/image` wrapper |
| `src/components/BioHero/BioHero.tsx` | bio card, extracted from `About.tsx` (`'use client'`) |
| `src/components/BioHero/BioHero.css` | hero rules moved from `About.css` |
| `src/components/BioHero/index.tsx` | `export { default } from './BioHero'` |
| `src/components/BlogList/BlogList.tsx` | `BLOG` heading + stacked post cards (server component) |
| `src/components/BlogList/BlogList.css` | list + card styles |
| `src/components/BlogList/index.tsx` | re-export |
| `src/components/BlogPost/BlogPost.tsx` | post container: back link, title, subtitle, date, divider, `{children}`, JSON-LD (`'use client'` not needed — server) |
| `src/components/BlogPost/BlogPost.css` | container + `.blog-prose` styles |
| `src/components/BlogPost/index.tsx` | re-export |
| `src/app/about/page.tsx` | `<BioHero/>` + `<Resume/>`, `metadata` |
| `src/app/about/about.css` | the resume slide-up overlap rules moved from `About.css` |
| `src/app/blog/page.tsx` | `<BlogList/>` standalone, `metadata` |
| `src/app/blog/blog.css` | `.blog-list-page` wrapper (header clearance) |
| `src/app/blog/[slug]/page.tsx` | SSG post page |
| `src/app/blog/[slug]/opengraph-image.tsx` | per-post OG image |
| `src/app/sitemap.ts` | sitemap |
| `src/app/feed.xml/route.ts` | RSS |
| `src/content/blog/hello-world.md` | starter post |
| `src/content/blog/draft-example.md` | a `draft: true` post, for verifying draft behavior (kept in the repo) |
| `public/blog/.gitkeep` | post-images directory |

### Modified

| File | Change |
|---|---|
| `next.config.ts` | `withMDX(...)` wrapper, `pageExtensions` |
| `package.json` / lockfile | MDX deps |
| `src/app/page.tsx` | `.main-container` > `<BioHero/>` + `<BlogList/>` |
| `src/app/layout.tsx` | font-awesome `<link>` moved here from `About.tsx`; RSS `<link rel="alternate">` |
| `src/app/globals.css` | `.main-container` + `@keyframes gradient` moved here from `About.css`; `[data-theme]` code-block show/hide rules; `body { font-family }` already uses Poppins — leave |
| `src/components/HeaderLinks/HeaderLinks.tsx` | add `Home` link; label the `/` link "Home"; `Home` active on `/` or `/blog*` |
| `src/components/Header/Header.tsx` | drawer: `links = ["Home", "About", "Schedule"]`, explicit route map `["/", "/about", "/schedule"]`, 3rd icon |
| `src/components/Resume/Resume.tsx` | `className="project-section-title"` → `"blurred-section-title"` |
| `src/components/Resume/Resume.css` | rename `.project-section-title` → `.blurred-section-title`; add `.blog-card-header`, `.blog-card-subtitle` to the shared `.project-card-header` / `.project-subtitle` selector lists |

### Deleted

`src/components/About/` (whole dir: `About.tsx`, `About.css`, `index.tsx`).

---

## Task 1: Install MDX deps + configure next.config + `@/` alias

**Files:** `package.json`, `next.config.ts`, `tsconfig.json`

- [ ] **Step 0: Add the `@/` path alias**

`tsconfig.json` has no `paths`. Add to `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

Next.js reads these for both the compiler and the bundler — no `next.config` change needed. Every `@/…` import in this plan resolves to `src/…`.

- [ ] **Step 1: Install**

```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx gray-matter remark-gfm rehype-pretty-code shiki rehype-slug server-only
```

(`.npmrc` already forces `legacy-peer-deps`.)

- [ ] **Step 2: Rewrite `next.config.ts`**

```ts
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [
      [
        "rehype-pretty-code",
        {
          theme: { light: "github-light", dark: "github-dark" },
          keepBackground: true,
        },
      ],
      "rehype-slug",
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: __dirname },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

export default withMDX(nextConfig);
```

- [ ] **Step 3: Verify the config loads**

Run: `npx next build 2>&1 | head -20`
Expected: "Running next.config.ts took …" then it proceeds to compile (it will fail later because `mdx-components.tsx` doesn't exist yet — that's Task 3). If it errors on the config itself (bad import, plugin resolution), fix before moving on.

- [ ] **Step 4: Commit**

```bash
git checkout master && git pull
git checkout -b blog
git add package.json package-lock.json next.config.ts tsconfig.json
git commit -m "chore: install @next/mdx + markdown pipeline deps, add @/ alias"
```

---

## Task 2: The posts library

**Files:** Create `src/lib/posts.ts`, `src/content/blog/hello-world.md`, `src/content/blog/draft-example.md`, `public/blog/.gitkeep`

**Interfaces:**
- Produces:
  - `type PostMeta = { slug: string; title: string; subtitle?: string; date: string; draft: boolean }`
  - `getAllPosts(opts?: { includeDrafts?: boolean }): PostMeta[]` — reverse-chronological by `date`
  - `getPostSlugs(opts?: { includeDrafts?: boolean }): string[]`
  - `assertPostExists(slug: string): void` — throws if no `src/content/blog/${slug}.md`

- [ ] **Step 1: Create the content dir + starter posts**

`src/content/blog/hello-world.md`:

```md
---
title: "Hello, world"
subtitle: "The first post — and a test of every markdown feature this blog renders."
date: 2026-09-01
draft: false
---

This is the first post. It exercises the prose styles.

## A second-level heading

Body text with **bold**, _italic_, and a [link to Unicorner](https://unicorner.news).

### A third-level heading

- A list item
- Another, with `inline code`
- A third

> A blockquote, for when something deserves emphasis.

```ts
type Post = { slug: string; title: string };
const p: Post = { slug: "hello-world", title: "Hello, world" };
```

![A placeholder image](/blog/placeholder.png)

| Column A | Column B |
| --- | --- |
| one | two |
| three | four |
```

`src/content/blog/draft-example.md`:

```md
---
title: "A draft that should not appear in production"
subtitle: "Visible in next dev, hidden in next build."
date: 2026-09-02
draft: true
---

If you can read this at `ethank.tech/blog/draft-example` in production, the
draft filter is broken.
```

`public/blog/.gitkeep`: empty file. (Also drop a real `public/blog/placeholder.png` — any small PNG — so `hello-world` doesn't 404 an image. A 1200×900 solid-color PNG is fine.)

- [ ] **Step 2: Create `src/lib/posts.ts`**

```ts
import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export type PostMeta = {
  slug: string;
  title: string;
  subtitle?: string;
  date: string; // "YYYY-MM-DD"
  draft: boolean;
};

function readAll(): PostMeta[] {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { data } = matter(raw);
    const slug = file.replace(/\.md$/, "");

    if (!data.title || !data.date) {
      throw new Error(`Post "${file}" is missing required frontmatter (title, date).`);
    }

    return {
      slug,
      title: String(data.title),
      subtitle: data.subtitle ? String(data.subtitle) : undefined,
      date: new Date(data.date).toISOString().slice(0, 10),
      draft: data.draft === true,
    } satisfies PostMeta;
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function filterDrafts(posts: PostMeta[], includeDrafts: boolean): PostMeta[] {
  if (includeDrafts || process.env.NODE_ENV !== "production") return posts;
  return posts.filter((p) => !p.draft);
}

export function getAllPosts(opts: { includeDrafts?: boolean } = {}): PostMeta[] {
  return filterDrafts(readAll(), opts.includeDrafts ?? false);
}

export function getPostSlugs(opts: { includeDrafts?: boolean } = {}): string[] {
  return getAllPosts(opts).map((p) => p.slug);
}

export function assertPostExists(slug: string): void {
  const file = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) {
    throw new Error(`No blog post for slug "${slug}"`);
  }
}
```

- [ ] **Step 3: Sanity-check with a throwaway script**

Run:

```bash
npx tsx -e "import('./src/lib/posts.ts').then(m => console.log(JSON.stringify(m.getAllPosts({includeDrafts:true}), null, 2)))" 2>&1 || node --experimental-strip-types -e "const {getAllPosts}=require('./src/lib/posts.ts'); console.log(getAllPosts({includeDrafts:true}))"
```

Expected: an array with `hello-world` and `draft-example`, `draft-example` marked `draft: true`, sorted newest-first (`draft-example` 09-02 before `hello-world` 09-01). If `tsx`/`--experimental-strip-types` aren't available, skip this step — Task 4's build exercises it.

- [ ] **Step 4: Commit**

```bash
git add src/lib/posts.ts src/content public/blog
git commit -m "feat: posts library + starter markdown posts"
```

---

## Task 3: mdx-components.tsx + BlogPost prose styles

**Files:** Create `src/mdx-components.tsx`, `src/components/BlogPost/BlogPost.css`

**Interfaces:**
- Produces: `useMDXComponents(): MDXComponents` (default + named export as Next expects). Maps `img` to a `next/image` wrapper. All other prose styling is CSS under `.blog-prose` (see `BlogPost.css`), so the component map only overrides `img`.

- [ ] **Step 1: Create `src/mdx-components.tsx`**

```tsx
import type { MDXComponents } from "mdx/types";
import Image from "next/image";

const components: MDXComponents = {
  img: (props) => (
    <Image
      src={typeof props.src === "string" ? props.src : ""}
      alt={props.alt ?? ""}
      width={1600}
      height={900}
      sizes="(max-width: 800px) 100vw, 736px"
      style={{
        width: "100%",
        height: "auto",
        borderRadius: 8,
        cornerShape: "superellipse(2.2)" as unknown as string,
        margin: "1.6em 0",
      }}
    />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
```

- [ ] **Step 2: Create `src/components/BlogPost/BlogPost.css`**

```css
.blog-page {
  padding: calc(var(--header-height) + 48px) clamp(16px, 5vw, 64px) 96px;
  box-sizing: border-box;
  min-height: 100vh;
}

/* filter (drop-shadow) and backdrop-filter split across two elements,
   like .resume-container-wrapper / .resume-cards-container */
.blog-container-shadow {
  filter: var(--drop-shadow-s);
  max-width: 768px;
  margin: 0 auto;
}
.blog-container {
  padding: clamp(16px, 4vw, 32px);
  box-sizing: border-box;
  background-color: var(--resume-background);
  border: 1px solid var(--resume-background);
  backdrop-filter: var(--resume-backdrop-filter);
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
.blog-back:hover {
  text-decoration: underline;
}

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

/* --- prose --- */
.blog-prose p {
  color: var(--text-color);
  font-weight: 300;
  font-size: clamp(15px, 2.4vw, 18px);
  line-height: 1.7;
  margin: 0 0 1.2em;
}
.blog-prose h2 {
  color: var(--large-heading-color);
  font-size: clamp(22px, 3.5vw, 30px);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.0125rem;
  margin: 1.8em 0 0.6em;
}
.blog-prose h3 {
  color: var(--large-heading-color);
  font-size: clamp(18px, 3vw, 24px);
  font-weight: 600;
  margin: 1.6em 0 0.5em;
}
.blog-prose h4 {
  color: var(--large-heading-color);
  font-size: clamp(16px, 2.5vw, 20px);
  font-weight: 600;
  margin: 1.4em 0 0.4em;
}
.blog-prose a {
  color: var(--accent-color);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.blog-prose ul,
.blog-prose ol {
  margin: 0 0 1.2em;
  padding-left: 1.4em;
  color: var(--text-color);
  font-weight: 300;
  font-size: clamp(15px, 2.4vw, 18px);
  line-height: 1.7;
}
.blog-prose li {
  margin-bottom: 0.4em;
}
.blog-prose blockquote {
  border-left: 3px solid var(--accent-color);
  padding-left: 1em;
  margin: 1.4em 0;
  color: var(--sub-text-color);
  font-style: italic;
}
.blog-prose :not(pre) > code {
  font-family: "OfficeCodePro", ui-monospace, monospace;
  font-size: 0.9em;
  background: var(--divider-color);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}
.blog-prose pre {
  border-radius: 8px;
  corner-shape: superellipse(2.2);
  padding: clamp(12px, 3vw, 20px);
  overflow-x: auto;
  margin: 1.4em 0;
  font-size: clamp(12px, 2vw, 14px);
  line-height: 1.6;
}
.blog-prose pre code {
  background: none;
  padding: 0;
  font-size: inherit;
}
.blog-prose hr {
  border: 0;
  border-top: 1px solid var(--divider-color);
  margin: 2em 0;
}
.blog-prose img {
  display: block;
}
.blog-prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.4em 0;
  font-size: clamp(13px, 2vw, 15px);
}
.blog-prose th,
.blog-prose td {
  border: 1px solid var(--divider-color);
  padding: 8px 12px;
  text-align: left;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/mdx-components.tsx src/components/BlogPost/BlogPost.css
git commit -m "feat: mdx-components + blog prose styles"
```

---

## Task 4: BlogPost component + the /blog/[slug] route

**Files:** Create `src/components/BlogPost/BlogPost.tsx`, `src/components/BlogPost/index.tsx`, `src/app/blog/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getAllPosts`, `getPostSlugs`, `assertPostExists` from `@/lib/posts`; `PostMeta`.
- `BlogPost` — default export, props `{ post: PostMeta; children: React.ReactNode }`. Renders `.blog-page > .blog-container-shadow > article.blog-container` with back link, title, `.blog-post-subtitle`, `.blog-post-date`, `.blog-divider`, `<div className="blog-prose">{children}</div>`, and a `<script type="application/ld+json">`.

- [ ] **Step 1: Create `src/components/BlogPost/BlogPost.tsx`**

```tsx
import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import "./BlogPost.css";

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPost({
  post,
  children,
}: {
  post: PostMeta;
  children: React.ReactNode;
}) {
  const url = `https://ethank.tech/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.subtitle ?? post.title,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: "Ethan Keshishian",
      url: "https://ethank.tech/about",
    },
    url,
    mainEntityOfPage: url,
  };

  return (
    <div className="blog-page">
      <div className="blog-container-shadow">
        <article className="blog-container">
          <Link href="/blog" className="blog-back">
            ← Back to blog
          </Link>
          <h1 className="blog-title">{post.title}</h1>
          {post.subtitle && (
            <p className="blog-post-subtitle">{post.subtitle}</p>
          )}
          <time className="blog-post-date" dateTime={post.date}>
            {formatDate(post.date)}
          </time>
          <hr className="blog-divider" />
          <div className="blog-prose">{children}</div>
        </article>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/BlogPost/index.tsx`**

```tsx
export { default } from "./BlogPost";
```

- [ ] **Step 3: Create `src/app/blog/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPost from "@/components/BlogPost";
import { getAllPosts, getPostSlugs, assertPostExists } from "@/lib/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs({ includeDrafts: true }).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getAllPosts({ includeDrafts: true }).find(
    (p) => p.slug === slug
  );
  if (!post) return {};
  const description = post.subtitle ?? post.title;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.date,
      url: `/blog/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getAllPosts({ includeDrafts: true }).find(
    (p) => p.slug === slug
  );
  if (!post) notFound();

  assertPostExists(slug);
  const { default: Post } = await import(`@/content/blog/${slug}.md`);

  return (
    <BlogPost post={post}>
      <Post />
    </BlogPost>
  );
}
```

- [ ] **Step 4: Build**

Run: `rm -rf .next && npx next build 2>&1 | tail -30`
Expected: compiles; the route list shows `/blog/[slug]` as a prerendered (SSG) route. In production mode `generateStaticParams` returns only `hello-world` (draft excluded). If Turbopack complains it can't statically analyze `import(\`@/content/blog/${slug}.md\`)`, apply the fallback: generate `src/content/blog/_map.ts` with one `import()` per file (see Risks in the spec) and import from that map instead.

- [ ] **Step 5: Browser check**

`npx next start -p 3002`, open `http://localhost:3002/blog/hello-world`.
Expected: the styled container, `← Back to blog`, title "Hello, world", subtitle, "September 1, 2026", divider, then the prose — headings, list, blockquote, a syntax-highlighted code block, the table. The image will be a broken box unless you added `public/blog/placeholder.png` (add one). Tab title = "Hello, world". `view-source:` shows `<script type="application/ld+json">` and the rendered article HTML.

Open `http://localhost:3002/blog/draft-example` → **404** (production build, draft excluded from `generateStaticParams` + `dynamicParams=false`).

- [ ] **Step 6: Dark-mode code block**

Toggle the theme on the post page. The code block's colors must swap (github-light ↔ github-dark). If both themes show at once or neither, add to `globals.css`:

```css
body:not(.dark-mode) [data-theme="dark"] { display: none; }
body.dark-mode [data-theme="light"] { display: none; }
```

(`rehype-pretty-code` with dual themes emits both; these rules pick one by `body.dark-mode`.) Rebuild, recheck.

- [ ] **Step 7: Commit**

```bash
git add src/components/BlogPost src/app/blog/\[slug\] src/app/globals.css
git commit -m "feat: /blog/[slug] post page with MDX rendering"
```

---

## Task 5: BlogList component

**Files:** Create `src/components/BlogList/BlogList.tsx`, `BlogList.css`, `index.tsx`; modify `src/components/Resume/Resume.tsx`, `src/components/Resume/Resume.css`

**Interfaces:**
- Consumes: `getAllPosts` from `@/lib/posts`.
- `BlogList` — default export, no props, server component. Renders `<section class="blog-section">` with an `<h2 class="blurred-section-title">BLOG</h2>` and `<ol class="blog-cards-container">` of post cards, or `<p class="blog-empty">Posts coming soon.</p>` when empty.

- [ ] **Step 1: Rename `.project-section-title` → `.blurred-section-title` in `Resume.css`**

Find the `.project-section-title` block (and its two `@media` overrides at max-width 899px and 599px) and rename the selector to `.blurred-section-title` in all three places. The rule bodies are unchanged.

- [ ] **Step 2: Update `Resume.tsx`**

Change `<h4 className="project-section-title">Projects</h4>` → `<h4 className="blurred-section-title">Projects</h4>`.

- [ ] **Step 3: Add blog-card selectors to the shared lists in `Resume.css`**

```css
.resume-card-header,
.project-card-header,
.blog-card-header {
  /* ...existing body unchanged... */
}

.resume-subtitle,
.project-subtitle,
.blog-card-subtitle {
  /* ...existing body unchanged... */
}
```

- [ ] **Step 4: Create `src/components/BlogList/BlogList.css`**

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
.blog-empty {
  color: var(--sub-text-color);
  font-weight: 300;
  text-align: center;
}
```

- [ ] **Step 5: Create `src/components/BlogList/BlogList.tsx`**

```tsx
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import "./BlogList.css";

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogList() {
  const posts = getAllPosts();

  return (
    <section className="blog-section">
      <h2 className="blurred-section-title">BLOG</h2>
      {posts.length === 0 ? (
        <p className="blog-empty">Posts coming soon.</p>
      ) : (
        <ol className="blog-cards-container">
          {posts.map((post) => (
            <li key={post.slug} className="blog-card-wrapper">
              <Link href={`/blog/${post.slug}`} className="blog-card">
                <h3 className="blog-card-header">{post.title}</h3>
                {post.subtitle && (
                  <p className="blog-card-subtitle">{post.subtitle}</p>
                )}
                <time className="blog-card-date" dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Create `src/components/BlogList/index.tsx`**

```tsx
export { default } from "./BlogList";
```

- [ ] **Step 7: Build**

`npx next build 2>&1 | tail -20` — clean.

- [ ] **Step 8: Commit**

```bash
git add src/components/BlogList src/components/Resume
git commit -m "feat: BlogList component + shared section-title / card-text classes"
```

---

## Task 6: Split About into BioHero; wire Home + /about

**Files:** Create `src/components/BioHero/{BioHero.tsx,BioHero.css,index.tsx}`, `src/app/about/{page.tsx,about.css}`; modify `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`; delete `src/components/About/`

**Interfaces:**
- `BioHero` — default export, no props, `'use client'`. Renders `<div className="hero-container"> … </div>` (photo, title, tagline, bio + Unicorner link, social icons, the `imageLoaded` fade classes) — exactly the JSX from current `About.tsx` lines 18–44.

- [ ] **Step 1: Move `.main-container` + `@keyframes gradient` from `About.css` → `globals.css`**

Cut lines 1–22 of `src/components/About/About.css` (`.main-container { … }` and `@keyframes gradient { … }`) and paste them into `src/app/globals.css` (anywhere after the `@font-face` blocks).

- [ ] **Step 2: Create `src/components/BioHero/BioHero.css`**

Move into it, from `About.css`: `.hero-container`, `.about-container-wrapper`, `.about-container` (keep the whole rule incl. the `grid-template-areas` — it's harmless), `.image-container`, `.image-section-container`, `.text-container`, `.text-content-container`, `.link`, `.link::after`, `.link-container:hover .link`, `.link-container:focus .link`, `.title`, `.tagline`, `.bio`, `.fade-1`, `.fade-2`, `.fade-3`, `.fade-4`, `@keyframes fade`, `@keyframes translate`, **and** every `@media` block whose rules target only those selectors (the `max-width` 1310 / 799 / 599 / 478 blocks — but see Step 3; the `.about-container` grid-template-areas swap and `.image-container` mobile rules go here; anything touching `.articles-container` / `.slide` goes to Step 3).

- [ ] **Step 3: Create `src/app/about/about.css`**

Move into it, from `About.css`: `.articles-container`, `.slide` (incl. its nested `@media` block), `@keyframes slide`, and the `@media (max-width: 1310px)` rules for `.about-container` `grid-template-areas` / padding that relate to the resume layout. **The goal:** the `.articles-container.slide` + `.resume-main-block { margin-top: -100px }` (in `Resume.css`) interaction stays exactly as it is on the live site.

After Steps 1–3, `src/components/About/About.css` should be empty — delete it.

- [ ] **Step 4: Create `src/components/BioHero/BioHero.tsx`**

```tsx
"use client";
import { useSelector } from "react-redux";
import Ethan from "@/assets/Ethan4.jpg";
import SocialMediaIcons from "@/components/SocialMediaIcons";
import { RootState } from "@/redux/reducers";
import { UNICORNER_LINK } from "@/constants";
import SquircleImage from "@/components/SquircleImage";
import "./BioHero.css";

export default function BioHero() {
  const imageLoaded = useSelector(
    (state: RootState) => state.readyToLoad.imageLoaded
  );
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
              <h2 className={imageLoaded ? "title fade-1" : "title"}>
                Hi, I'm Ethan.
              </h2>
              <p className={imageLoaded ? "tagline fade-2" : "tagline"}>
                I'm the Startup Storyteller.
              </p>
              <p className={imageLoaded ? "bio fade-3" : "bio"}>
                I’m a software engineer at Mercury, and one of the co-founders
                of{" "}
                <a className="link-container" href={UNICORNER_LINK}>
                  <span className="link">Unicorner</span>
                </a>
                , the startup community telling the stories of startups and
                their founders. I hold an MS and BS in CS/AI from UCLA.
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

(The `@/` alias was added in Task 1 Step 0. `@/assets/Ethan4.jpg` = `src/assets/Ethan4.jpg`, etc.)

- [ ] **Step 5: Create `src/components/BioHero/index.tsx`**

```tsx
export { default } from "./BioHero";
```

- [ ] **Step 6: Rewrite `src/app/page.tsx`**

```tsx
import BioHero from "@/components/BioHero";
import BlogList from "@/components/BlogList";

export default function Home() {
  return (
    <main className="main-container">
      <BioHero />
      <BlogList />
    </main>
  );
}
```

- [ ] **Step 7: Create `src/app/about/page.tsx`**

```tsx
import type { Metadata } from "next";
import BioHero from "@/components/BioHero";
import Resume from "@/components/Resume";
import "./about.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Ethan Keshishian — software engineer at Mercury, co-founder of Unicorner, MS/BS CS/AI from UCLA.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
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

- [ ] **Step 8: Move the font-awesome `<link>` to `layout.tsx`**

Current `About.tsx` line 16: `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />`. Add it to `layout.tsx` `<head>` (it's used by `SocialMediaIcons` which renders on `/` and `/about`).

- [ ] **Step 9: Delete `src/components/About/`**

```bash
git rm -r src/components/About
```

- [ ] **Step 10: Build + compare `/about` to production**

`npx next build && npx next start -p 3002`.

Open `http://localhost:3002/about` next to `https://ethank.tech/` (which still shows the old home = bio + resume + projects). They must match: bio card, the resume card sliding up to overlap the bio card's bottom edge (~100px), Education/Experience, the blurred PROJECTS heading, project cards. Screenshot-compare light + dark, wide + narrow.

Open `http://localhost:3002/` → bio card, then the BLOG heading and the `hello-world` card. The blog list sits below the bio card in normal flow (no overlap). Card hover lifts it.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor: split About into BioHero; Home = bio + blog list, /about = bio + resume"
```

---

## Task 7: /blog standalone list page + header nav

**Files:** Create `src/app/blog/page.tsx`, `src/app/blog/blog.css`; modify `src/components/HeaderLinks/HeaderLinks.tsx`, `src/components/Header/Header.tsx`

- [ ] **Step 1: Create `src/app/blog/blog.css`**

```css
.blog-list-page {
  padding-top: calc(var(--header-height) + 48px);
  padding-bottom: 96px;
  min-height: 100vh;
}
```

- [ ] **Step 2: Create `src/app/blog/page.tsx`**

```tsx
import type { Metadata } from "next";
import BlogList from "@/components/BlogList";
import "./blog.css";

export const metadata: Metadata = {
  title: "Blog",
  description: "Startup stories and notes by Ethan Keshishian.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return (
    <main className="blog-list-page">
      <BlogList />
    </main>
  );
}
```

- [ ] **Step 3: Rewrite `HeaderLinks.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./HeaderLinks.css";
import ThemeButton from "../ThemeButton";

export default function HeaderLinks() {
  const pathname = usePathname();
  const homeActive = pathname === "/" || pathname.startsWith("/blog");
  const cls = (active: boolean) =>
    `header-link-container${active ? " active-link" : ""}`;

  return (
    <div className="header-links-container">
      <Link href="/" className={cls(homeActive)}>
        <h4 className="header-link">Home</h4>
      </Link>
      <Link href="/about" className={cls(pathname === "/about")}>
        <h4 className="header-link">About</h4>
      </Link>
      <Link href="/schedule" className={cls(pathname === "/schedule")}>
        <h4 className="header-link">Schedule</h4>
      </Link>
      <ThemeButton />
    </div>
  );
}
```

- [ ] **Step 4: Update `Header.tsx` drawer**

Change:

```tsx
const links = ["About", "Schedule"];
```

to:

```tsx
const navItems: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Schedule", href: "/schedule" },
];
```

Change `handleDrawerButtonClick`:

```tsx
const handleDrawerButtonClick = (href: string) => {
  handleDrawerToggle();
  router.push(href);
};
```

Change the drawer `<List>` map:

```tsx
{navItems.map(({ label, href }) => (
  <ListItemButton key={href} onClick={() => handleDrawerButtonClick(href)}>
    <ListItemIcon sx={{ color: "var(--large-heading-color)" }}>
      {label === "Schedule" ? <CalendarTodayIcon /> : <InfoIcon />}
    </ListItemIcon>
    <ListItemText primary={label} sx={{ color: "var(--large-heading-color)" }} />
  </ListItemButton>
))}
```

(Home + About both get `InfoIcon`; Schedule gets `CalendarTodayIcon`. If you want a distinct Home icon, import `@mui/icons-material/Home` and branch on `label === "Home"`.)

- [ ] **Step 5: Build + browser**

`npx next build && npx next start -p 3002`.

- `/` — header shows Home / About / Schedule; **Home** underlined (active).
- `/blog` — the list, no bio card, clears the header; **Home** still active.
- `/blog/hello-world` — **Home** active.
- `/about` — **About** active.
- `/schedule` — **Schedule** active.
- Mobile (< 800px): hamburger → drawer with Home / About / Schedule; tapping each navigates and closes the drawer.

- [ ] **Step 6: Commit**

```bash
git add src/app/blog src/components/HeaderLinks src/components/Header
git commit -m "feat: /blog index page + Home/About/Schedule header nav"
```

---

## Task 8: sitemap + RSS

**Files:** Create `src/app/sitemap.ts`, `src/app/feed.xml/route.ts`; modify `src/app/layout.tsx`

- [ ] **Step 1: Create `src/app/sitemap.ts`**

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

- [ ] **Step 2: Create `src/app/feed.xml/route.ts`**

```ts
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-static";

const BASE = "https://ethank.tech";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const posts = getAllPosts();
  const items = posts
    .map((p) => {
      const url = `${BASE}/blog/${p.slug}`;
      const pubDate = new Date(p.date + "T00:00:00Z").toUTCString();
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${esc(p.subtitle ?? p.title)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ethan Keshishian</title>
    <link>${BASE}</link>
    <description>Startup stories and notes.</description>
    <language>en-us</language>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
```

- [ ] **Step 3: Add the RSS `<link>` to `layout.tsx` `<head>`**

```tsx
<link
  rel="alternate"
  type="application/rss+xml"
  title="Ethan Keshishian"
  href="/feed.xml"
/>
```

- [ ] **Step 4: Build + curl**

`npx next build && npx next start -p 3002`.

```bash
curl -s http://localhost:3002/sitemap.xml
curl -s -i http://localhost:3002/feed.xml | head -20
```

Expected:
- `sitemap.xml` — valid XML, `<url>` entries for `/`, `/about`, `/blog`, `/schedule`, and `/blog/hello-world` (NOT `/blog/draft-example`).
- `feed.xml` — `Content-Type: application/rss+xml`, valid RSS 2.0, one `<item>` for `hello-world` with an RFC-822 `<pubDate>` and escaped title. No draft.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/app/feed.xml src/app/layout.tsx
git commit -m "feat: sitemap.xml + RSS feed"
```

---

## Task 9: Per-post OG images

**Files:** Create `src/app/blog/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Confirm the Poppins font files for `ImageResponse`**

`ImageResponse` needs font `ArrayBuffer`s, not the `next/font` object. Check `public/fonts/` — the migration moved local fonts there. Poppins is loaded via `next/font/google` (not in `public/fonts/`). Add two Poppins weights to `public/fonts/`:

```bash
curl -sL "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf" -o public/fonts/Poppins-Regular.ttf
curl -sL "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf" -o public/fonts/Poppins-Bold.ttf
```

(Or use `Poppins-SemiBold.ttf`. Verify the files are non-empty TTFs.)

- [ ] **Step 2: Create `src/app/blog/[slug]/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAllPosts, getPostSlugs } from "@/lib/posts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getPostSlugs({ includeDrafts: true }).map((slug) => ({ slug }));
}

function font(name: string) {
  return readFileSync(join(process.cwd(), "public/fonts", name));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getAllPosts({ includeDrafts: true }).find((p) => p.slug === slug);
  const title = post?.title ?? "Ethan Keshishian";
  const date = post
    ? new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "linear-gradient(45deg, rgba(41,41,41,1) 20%, rgba(71,0,203,1))",
          color: "#fff",
          fontFamily: "Poppins",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 400, opacity: 0.85 }}>
          ethank.tech
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ fontSize: 28, fontWeight: 400, opacity: 0.85 }}>
          Ethan Keshishian{date ? `  ·  ${date}` : ""}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Poppins", data: font("Poppins-Regular.ttf"), weight: 400 },
        { name: "Poppins", data: font("Poppins-Bold.ttf"), weight: 700 },
      ],
    }
  );
}
```

- [ ] **Step 3: Build + check**

`npx next build` — the route list should show `/blog/[slug]/opengraph-image` prerendered.

`npx next start -p 3002`, then:

```bash
curl -s -o /tmp/og.png -w "%{content_type} %{size_download}\n" http://localhost:3002/blog/hello-world/opengraph-image
open /tmp/og.png   # or: file /tmp/og.png
```

Expected: `image/png`, non-trivial size, and the image shows "ethank.tech" / the title / "Ethan Keshishian · September 1, 2026" on the purple gradient. Poppins rendering (not a fallback serif).

Also: `curl -s http://localhost:3002/blog/hello-world | grep -o 'og:image[^>]*'` — the `og:image` meta should point at `…/blog/hello-world/opengraph-image` (auto-wired by the file convention; `generateMetadata` does NOT set it).

- [ ] **Step 4: Commit**

```bash
git add src/app/blog/\[slug\]/opengraph-image.tsx public/fonts
git commit -m "feat: per-post OG images via ImageResponse"
```

---

## Task 10: Full verification + preview deploy

**Files:** none (verification); append results to this plan

- [ ] **Step 1: Clean production build**

```bash
rm -rf .next && npx next build 2>&1 | tail -40
```

Expected: **zero errors**. The route list shows: `/` (SSG), `/about` (SSG), `/blog` (SSG), `/blog/[slug]` (SSG, 1 param — `hello-world`), `/blog/[slug]/opengraph-image` (SSG), `/schedule`, `/sitemap.xml`, `/feed.xml`, `/zoom` (dynamic). No `draft-example` in the params.

- [ ] **Step 2: `npx next start -p 3002` — browser pass (light + dark)**

- **`/`** — `<BioHero>` (photo, "Hi, I'm Ethan.", tagline, bio + Unicorner link, social icons, `imageLoaded` fade) → `BLOG` blurred heading → the `hello-world` card. Card hover-lifts. Gradient background animates. No blog/bio overlap.
- **`/blog`** — the list alone, clears the header, `Home` nav active.
- **`/blog/hello-world`** — 768px glassy container, `← Back to blog`, `<h1>`, subtitle, "September 1, 2026", divider, prose: h2/h3, list, blockquote, **code block highlighted in both light and dark**, table, image (needs `public/blog/placeholder.png`). Tab title "Hello, world". `view-source` has JSON-LD + full article HTML.
- **`/about`** — `<BioHero>` + Resume **with the slide-up overlap** — screenshot-compare against `https://ethank.tech/`. Byte-identical layout.
- **`/blog/draft-example`** → 404.
- **`/blog/nope`** → 404.
- **Header** — Home/About/Schedule, correct active states everywhere including `/blog/*`. Mobile drawer: 3 items, navigate + close.
- **No hydration warnings / console errors** on any route.

- [ ] **Step 3: `curl` pass**

```bash
curl -s http://localhost:3002/sitemap.xml | grep -c "<url>"        # expect 5 (/, /about, /blog, /schedule, hello-world)
curl -s http://localhost:3002/feed.xml | grep -c "<item>"          # expect 1
curl -s http://localhost:3002/blog/hello-world | grep -c "blog-prose"  # >=1 — SSG'd HTML
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/blog/draft-example  # 404
```

- [ ] **Step 4: `next dev` draft check**

```bash
npx next dev -p 3002
```

- `/` and `/blog` now show **both** `hello-world` and `draft-example` cards.
- `/blog/draft-example` renders (no 404).

Stop the dev server. Drafts must NOT leak into the production build (Step 1 already confirmed).

- [ ] **Step 5: Lighthouse**

Run Lighthouse (Chrome DevTools) on `http://localhost:3002/blog/hello-world` (production `next start`). SEO ≥ 95. Note the score.

- [ ] **Step 6: Push → Vercel preview**

```bash
git push -u origin blog
```

Vercel builds the `blog` branch → preview URL. Repeat Steps 2–3 against the preview. Check `og:image` renders a real preview by pasting a `…/blog/hello-world` preview URL into Slack or the [OpenGraph debugger](https://www.opengraph.xyz/).

- [ ] **Step 7: Record results**

Append a "Verification results" section to the bottom of this file. Commit.

```bash
git add docs/superpowers/plans/2026-08-31-blog-feature.md
git commit -m "docs: blog feature verification results"
```

---

## Task 11: Merge + deploy

- [ ] **Step 1: Merge to `master`** (after the preview passes)

```bash
git checkout master && git pull
git merge --no-ff blog
```

- [ ] **Step 2: Build the merged result**

```bash
rm -rf .next && npx next build 2>&1 | tail -20
```

Zero errors. If it fails, stop — the branch and worktree are intact, nothing pushed.

- [ ] **Step 3: Push**

```bash
git push origin master
```

Vercel deploys `master` to production (`ethank.tech`). Verify `https://ethank.tech/` shows the blog, `/about` shows the bio+resume, `/blog/hello-world` renders.

- [ ] **Step 4: Cleanup**

```bash
git branch -d blog
git push origin --delete blog
git branch -D blog-planning
```

- [ ] **Step 5: Submit the sitemap** (manual, optional)

Google Search Console → `ethank.tech` property → Sitemaps → submit `https://ethank.tech/sitemap.xml`.

---

## Self-Review

### 1. Spec coverage

| Spec § | Task |
|---|---|
| §2 routes (`/`, `/about`, `/blog`, `/blog/[slug]`, sitemap, feed, OG) | 4, 6, 7, 8, 9 |
| §2 header nav Home/About/Schedule + active states | 7 |
| §3 content model, frontmatter, slug=filename, `posts.ts`, draft rule | 1, 2 |
| §4 `@next/mdx` config, string plugins, `mdx-components.tsx`, `gray-matter` frontmatter, images, dual code themes | 1, 3, 4 |
| §5 file structure, `About` split, deletions | 6 |
| §5 CSS moves (`About.css` → `globals.css` / `BioHero.css` / `about.css`) | 6 |
| §6a shared `.blurred-section-title` | 5 |
| §6b BlogList card styles | 5 |
| §6c BlogPost container (two-element filter/backdrop split) | 3, 4 |
| §6d prose styles (`.blog-prose`) | 3 |
| §7a sitemap | 8 |
| §7b RSS route (no lib, `force-static`, XML-escape) | 8 |
| §7c per-post OG image (`ImageResponse`, `generateStaticParams`, font ArrayBuffers) | 9 |
| §7d per-post `generateMetadata` + canonical + `og:type article` | 4 |
| §7e `BlogPosting` JSON-LD | 4 |
| §8 verification (build, browser, curl, draft, Lighthouse) | 10 |
| §9 risks — dynamic import fallback, Safari two-element split, `/about` parity, ImageResponse fonts | 4 (Step 4), 3+4, 6 (Step 10), 9 (Step 1) |

No gaps.

### 2. Placeholder scan

- No "TBD"/"TODO". Task 6 Step 4 flags "verify `@/` alias, else use relative paths" — that's a real conditional, not a placeholder; both branches are specified.
- Task 9 Step 1's `curl` URLs for Poppins TTFs are a best-effort source; the step says "verify non-empty TTF" and offers `Poppins-SemiBold` as an alt. The plan-executor should confirm the download; if the raw GitHub path 404s, any Poppins TTF (e.g. from the `next/font` cache under `.next/` or fonts.google.com) works.
- Every code step has full code.

### 3. Type / name consistency

- `PostMeta` = `{ slug, title, subtitle?, date, draft }` — identical in `posts.ts` (Task 2), `BlogPost.tsx` (Task 4), `BlogList.tsx` (Task 5), `sitemap.ts` (Task 8), `feed.xml` (Task 8), `opengraph-image.tsx` (Task 9). ✓
- `getAllPosts(opts?)` / `getPostSlugs(opts?)` / `assertPostExists(slug)` — signatures consistent across all call sites. ✓
- `getAllPosts({ includeDrafts: true })` used in `generateStaticParams`, `generateMetadata`, the page body, and the OG route — consistent. The **list** (`BlogList`), sitemap, and RSS call `getAllPosts()` with no opts (drafts filtered in prod). ✓
- `.blurred-section-title` — introduced in Task 5 (rename), used by `Resume.tsx` (Task 5) and `BlogList.tsx` (Task 5). ✓
- `.blog-card-header` / `.blog-card-subtitle` — added to shared selector lists in Task 5, used in `BlogList.tsx` Task 5. ✓
- `.blog-container-shadow` + `.blog-container` two-element split — defined in `BlogPost.css` (Task 3), used in `BlogPost.tsx` (Task 4). ✓
- `formatDate` — a local helper duplicated in `BlogPost.tsx` and `BlogList.tsx` (identical impl). Acceptable (two small files); a shared `@/lib/date.ts` is a nice-to-have, not required.
- `BioHero` default export + `index.tsx` re-export — matches how `Resume`, `Schedule`, `Header` are structured in the repo. ✓
- Header: `navItems` array replaces `links`; `handleDrawerButtonClick(href: string)` replaces the `index` version — both call sites updated in Task 7 Step 4. ✓
