import React from 'react';
import About from '../About';
import './Body.css';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import Schedule from '../Schedule';

function Body() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <About />
        </Route>
        <Route exact path="/schedule">
          <Schedule />
        </Route>
      </Switch>
    </Router>
  );
}

export default Body;
