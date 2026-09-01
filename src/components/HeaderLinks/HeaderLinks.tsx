"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./HeaderLinks.css";
import ThemeButton from "../ThemeButton";

export default function HeaderLinks() {
  const pathname = usePathname();
  const cls = (href: string) =>
    `header-link-container${pathname === href ? " active-link" : ""}`;

  return (
    <div className="header-links-container">
      <Link href="/" className={cls("/")}>
        <h4 className="header-link">About</h4>
      </Link>
      <Link href="/schedule" className={cls("/schedule")}>
        <h4 className="header-link">Schedule</h4>
      </Link>
      <ThemeButton />
    </div>
  );
}
