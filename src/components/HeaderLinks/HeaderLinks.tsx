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
        className="header-link-container"
        activeClassName="active-link"
      >
        <h4 className="header-link">About</h4>
      </NavLink>
      <NavLink
        exact
        to="/schedule"
        className="header-link-container"
        activeClassName="active-link"
      >
        <h4 className="header-link">Schedule</h4>
      </NavLink>
      <ThemeButton />
    </div>
  );
}

export default HeaderLinks;
