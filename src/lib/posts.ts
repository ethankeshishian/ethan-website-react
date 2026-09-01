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
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { data } = matter(raw);
    const slug = file.replace(/\.md$/, "");

    if (!data.title || !data.date) {
      throw new Error(
        `Post "${file}" is missing required frontmatter (title, date).`
      );
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
