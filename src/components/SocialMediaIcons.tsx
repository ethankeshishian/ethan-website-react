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

function SocialMediaIcons() {
  return (
    <div className="icon-container">
      <a href="https://linkedin.com/in/ethankeshishian">
        <div className="social-container linkedin">
          <FontAwesomeIcon
            icon={faLinkedin}
            className="fa-linkedin social-icons"
          />
        </div>
      </a>
      <a href="https://github.com/ethankeshishian">
        <div className="social-container github">
          <FontAwesomeIcon icon={faGithub} className="fa-github social-icons" />
        </div>{" "}
      </a>
      <a href="https://twitter.com/ethankeshishian">
        <div className="social-container twitter">
          <FontAwesomeIcon
            icon={faTwitter}
            className="fa-twitter social-icons"
          />
        </div>
      </a>
      <a href="https://instagram.com/ethankeshishian">
        <div className="social-container instagram">
          <FontAwesomeIcon
            icon={faInstagram}
            className="fa-instagram social-icons"
          />
        </div>
      </a>
      <a href="https://open.spotify.com/user/baklou">
        <div className="social-container spotify">
          <FontAwesomeIcon
            icon={faSpotify}
            className="fa-spotify social-icons"
          />
        </div>
      </a>
      <a href="mailto:keshishianethan+site@gmail.com">
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
