import React from 'react';
import './Header.css';
import HeaderLinks from '../HeaderLinks';

function Header() {
  return (
    <div className="header-container">
      <a href="/" className="main-heading-link">
        <h2 className="main-heading">E.H.K.</h2>
      </a>
      <div className="links-container">
        <HeaderLinks />
      </div>
    </div>
  );
}
export default Header;
