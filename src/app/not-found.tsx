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
