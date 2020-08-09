import React from "react";
import "./App.css";
import "./constants.css";
import Body from "./components/Body";
import MyHeader from "./components/MyHeader";
import MyFooter from "./components/MyFooter";

function App() {
  return (
    <div className="App">
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
