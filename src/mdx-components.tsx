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
      className="blog-prose-img"
      style={{ width: "100%", height: "auto", margin: "1.6em 0" }}
    />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
