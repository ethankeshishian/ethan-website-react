import React from "react";
import Ethan from "../assets/Ethan.jpg";
import "../styles/Body.css";

function Body() {
  return (
    <div>
      <div className="content-container">
        <div className="image-container">
          <img className="image" src={Ethan} alt="Ethan Keshishian" />
        </div>
        <div className="text-container">
          <h1>Hi, I'm Ethan</h1>
          <p className="bio">
            I’m a computer science student at UCLA, class of 2023. Check out my
            LinkedIn for more on what I do, or check out my GitHub for
            information on some of my projects.
          </p>
        </div>
      </div>
    </div>
  );
}
export default Body;
