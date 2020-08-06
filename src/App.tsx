import React from "react";
import "./App.css";
import Body from "./components/Body";
import MyHeader from "./components/MyHeader";
import MyFooter from "./components/MyFooter";

function App() {
  return (
    <div className="App">
      <MyHeader></MyHeader>
      <Body></Body>
      <MyFooter></MyFooter>
    </div>
  );
}

export default App;
