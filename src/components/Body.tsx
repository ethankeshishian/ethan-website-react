import React from 'react';
import Ethan from '../assets/Ethan2.jpg';
import SocialMediaIcons from '../components/SocialMediaIcons';
import '../styles/Body.css';
import Articles from './Articles';

function Body() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
      />
      <div className="main-container">
        <div className="body-container">
          <div className="image-container">
            <img className="image" src={Ethan} alt="Ethan Keshishian" />
          </div>
          <div className="text-container">
            <div className="text-content-container">
              <h2 className="title fade-1">Hi, I'm Ethan</h2>
              <p className="bio fade-2">
                I’m a computer science student at UCLA, class of 2023. Check out
                my LinkedIn for more on what I do, or check out my GitHub for
                information on some of my projects.
              </p>
              <div className="social-icons fade-3">
                <SocialMediaIcons />
              </div>
            </div>
          </div>
          <div className="articles-container">
            <Articles />
          </div>
        </div>
      </div>
    </>
  );
}
export default Body;
