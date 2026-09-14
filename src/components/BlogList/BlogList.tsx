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
