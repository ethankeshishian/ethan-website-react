import React, { useEffect, useState } from "react";
import "../styles/Article.css";

function Article(props: any) {
  const [article, setArticle] = useState({
    title: "",
    date: "",
    img: "",
    description: "",
  });

  useEffect(() => {
    fetch(props.url)
      .then((response) => response.json())
      .then(
        (json: { userId: number; id: number; title: string; body: string }) => {
          setArticle({
            title: json.title,
            date: json.id.toString(),
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
      <a href={props.url} className="article-text-link">
        <h3 className="article-title article-text">{article.title}</h3>
      </a>
      <p className="article-date article-text">{article.date}</p>
      <a href={props.url}>
        <div className="article-image-container">
          <img className="article-img " src={article.img} alt="Article" />
        </div>
      </a>
      <a href={props.url} className="article-text-link">
        <p className="article-description article-text">
          {article.description}
        </p>
      </a>
    </div>
  );
}

export default Article;
