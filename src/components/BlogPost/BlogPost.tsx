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
