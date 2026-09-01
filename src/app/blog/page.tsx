import type { Metadata } from "next";
import BlogList from "../../components/BlogList";
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
