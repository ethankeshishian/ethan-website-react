import type { Metadata } from "next";
import BioHero from "../../components/BioHero";
import Resume from "../../components/Resume";
import "./about.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Ethan Keshishian — software engineer at Mercury, co-founder of Unicorner, MS/BS CS/AI from UCLA.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="main-container">
      <BioHero />
      <div className="articles-container slide">
        <Resume />
      </div>
    </main>
  );
}
