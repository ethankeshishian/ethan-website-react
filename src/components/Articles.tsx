import React from "react";
import Article from "./Article";
import "../styles/Articles.css";

function Articles() {
  return (
    <div className="articles-container">
      <Article url="https://jsonplaceholder.typicode.com/posts/1" />
      {/* <Article url="https://jsonplaceholder.typicode.com/posts/1" /> */}
      {/* <Article url="https://jsonplaceholder.typicode.com/posts/1" /> */}
    </div>
  );
}

export default Articles;
