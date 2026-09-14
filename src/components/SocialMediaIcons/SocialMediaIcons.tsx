"use client";
/* eslint-disable jsx-a11y/anchor-has-content */
import React from 'react';
import './SocialMediaIcons.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLinkedin,
  faGithub,
  faXTwitter,
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import {
  LINKEDIN_LINK,
  GITHUB_LINK,
  TWITTER_LINK,
  EMAIL_LINK,
} from '../../constants';

function SocialMediaIcons() {
  return (
    <div className="icon-container">
      <a href={LINKEDIN_LINK} className="social-icon-link">
        <div className="social-container linkedin">
          <FontAwesomeIcon
            icon={faLinkedin}
            className="fa-linkedin social-icons"
          />
        </div>
      </a>
      <a href={TWITTER_LINK} className="social-icon-link">
        <div className="social-container x">
          <FontAwesomeIcon
            icon={faXTwitter}
            className="fa-x-twitter social-icons"
          />
        </div>
      </a>
      <a href={GITHUB_LINK} className="social-icon-link">
        <div className="social-container github">
          <FontAwesomeIcon icon={faGithub} className="fa-github social-icons" />
        </div>
      </a>
      <a href={EMAIL_LINK} className="social-icon-link">
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
