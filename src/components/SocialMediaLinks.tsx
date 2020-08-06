import React from "react";
import "../styles/SocialMediaLinks.css";
import {
  LINKEDIN_LINK,
  GITHUB_LINK,
  INSTAGRAM_LINK,
  TWITTER_LINK,
  SPOTIFY_LINK,
  EMAIL_LINK,
} from "../constants";

function SocialMediaLinks() {
  return (
    <div className="links-container">
      <a href={LINKEDIN_LINK} className="link-container">
        <h4 className="link">LinkedIn</h4>
      </a>
      <a href={GITHUB_LINK} className="link-container">
        <h4 className="link">GitHub</h4>
      </a>
      <a href={INSTAGRAM_LINK} className="link-container">
        <h4 className="link">Twitter</h4>
      </a>
      <a href={TWITTER_LINK} className="link-container">
        <h4 className="link">Instagram</h4>
      </a>
      <a href={SPOTIFY_LINK} className="link-container">
        <h4 className="link">Spotify</h4>
      </a>
      <a href={EMAIL_LINK} className="link-container">
        <h4 className="link">Email</h4>
      </a>
    </div>
  );
}

export default SocialMediaLinks;
