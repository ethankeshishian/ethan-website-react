import React from 'react';
import '../styles/MyHeader.css';

function MyHeader() {
  return (
    <div className="heading-container">
      <a href="/" className="main-heading-link">
        <h1 className="main-heading">Ethan Keshishian</h1>
      </a>
      <p className="subtext">
        Software Engineer | Founder | UCLA Computer Science
      </p>
    </div>
  );
}
export default MyHeader;
