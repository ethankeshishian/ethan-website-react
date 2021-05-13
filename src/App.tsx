import React from 'react';
import './App.css';
import './constants.css';
import Body from './components/Body';
import MyHeader from './components/MyHeader';
import MyFooter from './components/MyFooter';
import ReactGA from 'react-ga';
import { useSelector } from 'react-redux';
import { RootState } from './redux/reducers';

function App() {
  const trackingID = 'UA-171410103-1';
  ReactGA.initialize(trackingID);
  ReactGA.pageview('/homepage');

  const imageLoaded = useSelector(
    (state: RootState) => state.readyToLoad.imageLoaded
  );
  return (
    <div className={imageLoaded ? 'App app-fade' : 'App notReadyToLoad'}>
      <div className="header">
        <MyHeader />
      </div>
      <div className="body">
        <Body />
      </div>
      <div className="footer">
        <MyFooter />
      </div>
    </div>
  );
}

export default App;
