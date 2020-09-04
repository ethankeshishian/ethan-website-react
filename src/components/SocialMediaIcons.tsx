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
  faGoodreadsG,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import {
  LINKEDIN_LINK,
  GITHUB_LINK,
  INSTAGRAM_LINK,
  TWITTER_LINK,
  SPOTIFY_LINK,
  GOODREADS_LINK,
  EMAIL_LINK,
  buttonType,
  linkType,
  linkEvent,
} from "../constants";

function SocialMediaIcons() {
  function handleClick(site: string) {
    linkEvent(site, buttonType.Round);
  }
  const middleMouseHandler = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    site: string
  ) => {
    if (event.button === 1) {
      handleClick(site);
    }
  };
  return (
    <div className="icon-container">
      <a
        href={LINKEDIN_LINK}
        onClick={() => handleClick(linkType.Linkedin)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Linkedin)}
      >
        <div className="social-container linkedin">
          <FontAwesomeIcon
            icon={faLinkedin}
            className="fa-linkedin social-icons"
          />
        </div>
      </a>
      <a
        href={GITHUB_LINK}
        onClick={() => handleClick(linkType.Github)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Github)}
      >
        <div className="social-container github">
          <FontAwesomeIcon icon={faGithub} className="fa-github social-icons" />
        </div>
      </a>
      <a
        href={TWITTER_LINK}
        onClick={() => handleClick(linkType.Twitter)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Twitter)}
      >
        <div className="social-container twitter">
          <FontAwesomeIcon
            icon={faTwitter}
            className="fa-twitter social-icons"
          />
        </div>
      </a>
      <a
        href={INSTAGRAM_LINK}
        onClick={() => handleClick(linkType.Instagram)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Instagram)}
      >
        <div className="social-container instagram">
          <FontAwesomeIcon
            icon={faInstagram}
            className="fa-instagram social-icons"
          />
        </div>
      </a>
      <a
        href={SPOTIFY_LINK}
        onClick={() => handleClick(linkType.Spotify)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Spotify)}
      >
        <div className="social-container spotify">
          <FontAwesomeIcon
            icon={faSpotify}
            className="fa-spotify social-icons"
          />
        </div>
      </a>
      <a
        href={GOODREADS_LINK}
        onClick={() => handleClick(linkType.Goodreads)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Goodreads)}
      >
        <div className="social-container goodreads">
          <FontAwesomeIcon
            icon={faGoodreadsG}
            className="fa-goodreads social-icons"
          />
        </div>
      </a>
      <a
        href={EMAIL_LINK}
        onClick={() => handleClick(linkType.Email)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Email)}
      >
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
