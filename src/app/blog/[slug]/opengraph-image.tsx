import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAllPosts, getPostSlugs } from "@/lib/posts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  // Drafts get an OG route in dev only; production 404s them (dynamicParams=false on the page).
  return getPostSlugs().map((slug) => ({ slug }));
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
          {date ? `Ethan Keshishian  ·  ${date}` : "Ethan Keshishian"}
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
