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
