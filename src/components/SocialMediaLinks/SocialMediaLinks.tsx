import React from 'react';
import './SocialMediaLinks.css';
import {
  LINKEDIN_LINK,
  GITHUB_LINK,
  INSTAGRAM_LINK,
  TWITTER_LINK,
  SPOTIFY_LINK,
  EMAIL_LINK,
  buttonType,
  linkType,
  linkEvent,
} from '../../constants';

function SocialMediaLinks() {
  function handleClick(site: string) {
    linkEvent(site, buttonType.Footer);
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
    <div className="social-links-container">
      <a
        href={LINKEDIN_LINK}
        className="link-container"
        onClick={() => handleClick(linkType.Linkedin)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Linkedin)}
      >
        <h4 className="social-link">LinkedIn</h4>
      </a>
      <a
        href={GITHUB_LINK}
        className="link-container"
        onClick={() => handleClick(linkType.Github)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Github)}
      >
        <h4 className="social-link">GitHub</h4>
      </a>
      <a
        href={TWITTER_LINK}
        className="link-container"
        onClick={() => handleClick(linkType.Twitter)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Twitter)}
      >
        <h4 className="social-link">Twitter</h4>
      </a>
      <a
        href={INSTAGRAM_LINK}
        className="link-container"
        onClick={() => handleClick(linkType.Instagram)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Instagram)}
      >
        <h4 className="social-link">Instagram</h4>
      </a>
      <a
        href={SPOTIFY_LINK}
        className="link-container"
        onClick={() => handleClick(linkType.Spotify)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Spotify)}
      >
        <h4 className="social-link">Spotify</h4>
      </a>
      <a
        href={EMAIL_LINK}
        className="link-container"
        onClick={() => handleClick(linkType.Email)}
        onMouseDown={(event) => middleMouseHandler(event, linkType.Email)}
      >
        <h4 className="social-link">Email</h4>
      </a>
    </div>
  );
}

export default SocialMediaLinks;
