import React from "react";
import "./App.css";
import "./constants.css";
import Body from "./components/Body";
import Header from "./components/Header";
import ReactGA from "react-ga";
import { useSelector } from "react-redux";
import { RootState } from "./redux/reducers";
import { BrowserRouter as Router } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

function App() {
    const trackingID = "UA-171410103-1";
    ReactGA.initialize(trackingID);
    ReactGA.pageview("/homepage");

    const imageLoaded = useSelector((state: RootState) => state.readyToLoad.imageLoaded);

    return (
        <div className={imageLoaded ? "App app-fade" : "App notReadyToLoad"}>
            <Router>
                <ScrollToTop />
                <div className="header">
                    <Header />
                </div>
                <div className="body">
                    <Body />
                </div>
            </Router>
        </div>
    );
}

export default App;
