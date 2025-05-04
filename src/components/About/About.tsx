import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Ethan from "../../assets/Ethan4.jpg";
import SocialMediaIcons from "../SocialMediaIcons";
import { RootState } from "../../redux/reducers";
import "./About.css";
import Resume from "../Resume";
import { SPOTCLUB_LINK, UNICORNER_LINK } from "../../constants";
import Squircle from "../Squircle"
import SquircleImage from "../SquircleImage"

function About() {
  const dispatch = useDispatch();
  const imageLoaded = useSelector((state: RootState) => state.readyToLoad.imageLoaded);
  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
      <div className="main-container">
        <div className="hero-container">
          <span className="about-container-wrapper">
            <Squircle className="about-container" cornerRadius={8} borderWidth={1}>
              <div className="image-section-container">
                <div className="image-container">
                  <SquircleImage
                    src={Ethan}
                    alt="Ethan Keshishian"
                    //className="image"
                    onLoad={() =>
                      dispatch({ type: "EDIT_IMAGE_LOADED", payload: true })
                    }
                  />
                </div>
              </div>
              <div className="text-container">
                <div className="text-content-container">
                  <h2 className={imageLoaded ? "title fade-1" : "title"}>Hi, I'm Ethan.</h2>
                  <p className={imageLoaded ? "bio fade-2" : "bio"}>
                    I’m a software engineer at Mercury, and a recent UCLA master's graduate. I'm working on{" "}
                    <a className="link-container" href={UNICORNER_LINK}>
                      <span className="link">Unicorner</span>
                    </a>
                  , a newsletter that breaks down up-and-coming startups every week, and{" "}
                    <a className="link-container" href={SPOTCLUB_LINK}>
                      <span className="link">SpotClub</span>
                    </a>
                  , a podcast building a community of innovators.
                </p>
                  <div className={imageLoaded ? "social-icons fade-3" : "social-icons"}>
                    <SocialMediaIcons />
                  </div>
                </div>
              </div>
            </Squircle>
          </span>
        </div>
        <div className={imageLoaded ? "articles-container slide" : "articles-container"}>
          <Resume />
        </div>
      </div>
    </>
  );
}
export default About;
