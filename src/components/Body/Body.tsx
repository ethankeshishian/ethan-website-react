import React from 'react';
import About from '../About';
import './Body.css';
import { Switch, Route } from 'react-router-dom';
import Schedule from '../Schedule';

function Body() {
  return (
    <Switch>
      <Route exact path="/">
        <About />
      </Route>
      <Route exact path="/schedule">
        <Schedule />
      </Route>
    </Switch>
  );
}

export default Body;
