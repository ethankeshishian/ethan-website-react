import React from "react";
import "../styles/MyFooter.css";
import SocialMediaLinks from "../components/SocialMediaLinks";

function MyFooter() {
  return (
    <div className="footer-container">
      <h3 className="name">Ethan Keshishian</h3>
      <div className="links-container"></div>
      <SocialMediaLinks />
    </div>
  );
}
export default MyFooter;
