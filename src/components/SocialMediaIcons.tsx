/* eslint-disable jsx-a11y/anchor-has-content */
import React from "react";
import "../styles/SocialMediaIcons.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLinkedin,
  faGithub,
  faInstagram,
  faTwitter,
  faSpotify,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import {
  LINKEDIN_LINK,
  GITHUB_LINK,
  INSTAGRAM_LINK,
  TWITTER_LINK,
  SPOTIFY_LINK,
  EMAIL_LINK,
} from "../constants";

function SocialMediaIcons() {
  return (
    <div className="icon-container">
      <a href={LINKEDIN_LINK}>
        <div className="social-container linkedin">
          <FontAwesomeIcon
            icon={faLinkedin}
            className="fa-linkedin social-icons"
          />
        </div>
      </a>
      <a href={GITHUB_LINK}>
        <div className="social-container github">
          <FontAwesomeIcon icon={faGithub} className="fa-github social-icons" />
        </div>{" "}
      </a>
      <a href={INSTAGRAM_LINK}>
        <div className="social-container twitter">
          <FontAwesomeIcon
            icon={faTwitter}
            className="fa-twitter social-icons"
          />
        </div>
      </a>
      <a href={TWITTER_LINK}>
        <div className="social-container instagram">
          <FontAwesomeIcon
            icon={faInstagram}
            className="fa-instagram social-icons"
          />
        </div>
      </a>
      <a href={SPOTIFY_LINK}>
        <div className="social-container spotify">
          <FontAwesomeIcon
            icon={faSpotify}
            className="fa-spotify social-icons"
          />
        </div>
      </a>
      <a href={EMAIL_LINK}>
        <div className="social-container envelope">
          <FontAwesomeIcon
            icon={faEnvelope}
            className="fa-envelope social-icons"
          />
        </div>
      </a>
    </div>
  );
}

export default SocialMediaIcons;
