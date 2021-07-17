import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Ethan from '../../assets/Ethan2.jpg';
import SocialMediaIcons from '../SocialMediaIcons';
import { RootState } from '../../redux/reducers';
import './About.css';
import Articles from '../Articles';

function About() {
  const dispatch = useDispatch();
  const imageLoaded = useSelector(
    (state: RootState) => state.readyToLoad.imageLoaded
  );
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
      />
      <div className="main-container">
        <div className="about-container">
          <div className="image-container">
            <img
              className="image"
              src={Ethan}
              alt="Ethan Keshishian"
              onLoad={() =>
                dispatch({ type: 'EDIT_IMAGE_LOADED', payload: true })
              }
            />
          </div>
          <div className="text-container">
            <div className="text-content-container">
              <h2 className={imageLoaded ? 'title fade-1' : 'title'}>
                Hi, I'm Ethan Keshishian
              </h2>
              <p className={imageLoaded ? 'bio fade-2' : 'bio'}>
                I’m a computer science student at UCLA, class of 2023. Check out
                my LinkedIn for more on what I do, or check out my GitHub for
                information on some of my projects.
              </p>
              <div
                className={imageLoaded ? 'social-icons fade-3' : 'social-icons'}
              >
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
export default About;
