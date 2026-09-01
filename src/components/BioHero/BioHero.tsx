"use client";
import { useSelector } from "react-redux";
import Ethan from "../../assets/Ethan4.jpg";
import SocialMediaIcons from "../SocialMediaIcons";
import { RootState } from "../../redux/reducers";
import { UNICORNER_LINK } from "../../constants";
import SquircleImage from "../SquircleImage";
import "./BioHero.css";

export default function BioHero() {
  const imageLoaded = useSelector(
    (state: RootState) => state.readyToLoad.imageLoaded
  );
  return (
    <div className="hero-container">
      <span className="about-container-wrapper">
        <div className="about-container">
          <div className="image-section-container">
            <div className="image-container">
              <SquircleImage src={Ethan.src} alt="Ethan Keshishian" />
            </div>
          </div>
          <div className="text-container">
            <div className="text-content-container">
              <h2 className={imageLoaded ? "title fade-1" : "title"}>
                Hi, I'm Ethan.
              </h2>
              <p className={imageLoaded ? "tagline fade-2" : "tagline"}>
                I'm the Startup Storyteller.
              </p>
              <p className={imageLoaded ? "bio fade-3" : "bio"}>
                I’m a software engineer at Mercury, and one of the co-founders
                of{" "}
                <a className="link-container" href={UNICORNER_LINK}>
                  <span className="link">Unicorner</span>
                </a>
                , the startup community telling the stories of startups and
                their founders. I hold an MS and BS in CS/AI from UCLA.
              </p>
              <div
                className={imageLoaded ? "social-icons fade-4" : "social-icons"}
              >
                <SocialMediaIcons />
              </div>
            </div>
          </div>
        </div>
      </span>
    </div>
  );
}
