import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [
      // strip the YAML frontmatter block so it isn't rendered as body text
      ["remark-frontmatter", ["yaml"]],
      "remark-gfm",
    ],
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
