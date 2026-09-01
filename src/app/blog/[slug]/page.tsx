import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPost from "@/components/BlogPost";
import { getAllPosts, getPostSlugs, assertPostExists } from "@/lib/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  // Drafts get a route in dev only; in production they 404 (dynamicParams = false).
  return getPostSlugs().map((slug) => ({ slug }));
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
