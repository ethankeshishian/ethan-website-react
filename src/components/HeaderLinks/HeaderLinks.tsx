import React from 'react';
import './HeaderLinks.css';
// import {
//   buttonType,
//   linkType,
//   linkEvent,
// } from '../../constants';
import { NavLink } from 'react-router-dom';
import ThemeButton from '../ThemeButton';

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
    <div className="header-links-container">
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
      <ThemeButton />
    </div>
  );
}

export default HeaderLinks;
