import React from 'react';
import About from '../About';
import './Body.css';
import { Switch, Route } from 'react-router-dom';
import Schedule from '../Schedule';
import { ZOOM } from '../../constants';

function Body() {
  return (
    <Switch>
      <Route exact path="/">
        <About />
      </Route>
      <Route exact path="/schedule">
        <Schedule />
      </Route>
      <Route
        path="/zoom"
        component={() => {
          window.location.replace(ZOOM);
          return null;
        }}
      />
    </Switch>
  );
}

export default Body;
