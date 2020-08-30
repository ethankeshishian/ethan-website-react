import React from "react";
import Article from "./Article";
import "../styles/Articles.css";

function Articles() {
  return (
    <div>
      <h2 className="articles-header">Articles:</h2>
      <div className="articles-container">
        <Article url="https://jsonplaceholder.typicode.com/posts/1" />
        <Article url="https://jsonplaceholder.typicode.com/posts/1" />
        <Article url="https://jsonplaceholder.typicode.com/posts/1" />
      </div>
    </div>
  );
}

export default Articles;
