import React, { useEffect, useState } from "react";
import "../styles/Article.css";

function Article(props: any) {
  const [article, setArticle] = useState({
    title: "",
    img: "",
    description: "",
  });
  // let article: {
  //   title: string;
  //   img: string;
  //   description: string;
  // } = {
  //   title: "error",
  //   img: "error",
  //   description: "error",
  // };

  useEffect(() => {
    fetch(props.url)
      .then((response) => response.json())
      .then(
        (json: { userId: number; id: number; title: string; body: string }) => {
          setArticle({
            title: json.title,
            img:
              "https://i.pinimg.com/736x/55/3c/50/553c50be9b34f7c4d04fb2445091a280.jpg",
            description: json.body,
          });
          // console.log(json);
          // console.log(article);
        }
      );
  }, [props.url]);
  return (
    <div className="article-container">
      <p className="article-title">{article.title}</p>
      <div className="article-image-container">
        <img className="article-img" src={article.img} />
      </div>
      <p className="article-description">{article.description}</p>
    </div>
    // add date?
  );
}

export default Article;
