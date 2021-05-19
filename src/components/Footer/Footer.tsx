import React from 'react';
import './Footer.css';
import SocialMediaLinks from '../SocialMediaLinks';

function Footer() {
  return (
    <div className="footer-container">
      <h3 className="name">Ethan Keshishian</h3>
      <div className="links-container">
        <SocialMediaLinks />
      </div>
    </div>
  );
}
export default Footer;
