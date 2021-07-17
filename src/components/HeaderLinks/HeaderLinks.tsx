import React from 'react';
import './HeaderLinks.css';
// import {
//   LINKEDIN_LINK,
//   GITHUB_LINK,
//   INSTAGRAM_LINK,
//   TWITTER_LINK,
//   SPOTIFY_LINK,
//   EMAIL_LINK,
//   buttonType,
//   linkType,
//   linkEvent,
// } from '../../constants';
import { NavLink } from 'react-router-dom';

function HeaderLinks() {
  // function handleClick(site: string) {
  //   linkEvent(site, buttonType.Footer);
  // }
  // const middleMouseHandler = (
  //   event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  //   site: string
  // ) => {
  //   if (event.button === 1) {
  //     handleClick(site);
  //   }
  // };

  return (
    <div className="social-links-container">
      <NavLink
        exact
        to="/"
        className="link-container"
        activeClassName="active-link"
      >
        <h4 className="link">About</h4>
      </NavLink>
      <NavLink
        exact
        to="/schedule"
        className="link-container"
        activeClassName="active-link"
      >
        <h4 className="link">Schedule</h4>
      </NavLink>
    </div>
  );
}

export default HeaderLinks;
