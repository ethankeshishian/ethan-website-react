import React from "react";
import "./Resume.css";
import ResumeJSON from "../../assets/affinda-parser-mXLMitjA.json";
import Squircle from "../Squircle"

function Resume() {
  let resumeData = ResumeJSON.data;
  let educationData = resumeData.education;
  let workData = resumeData.workExperience;
  let projectData = resumeData.projects;

  return (
    <div className="resume-main-block">
      <span className="resume-container-wrapper">
        <Squircle className="resume-cards-container" cornerRadius={8} borderWidth={1}>
          <h4 className="resume-section-title">Education</h4>
          {educationData.map((item) => (
            <div className="resume-card">
              <div className="resume-card-image-container">
                <img className="resume-card-image" src={require("../../assets/logos/" + item.logo).default} alt={item.logo} />
              </div>
              <div>
                <h5 className="resume-card-header">{item.accreditation.inputStr}</h5>
                <div className="resume-subtitle">
                  {item.organization}
                  {" • "} {item.dates.rawText}
                </div>
                <div>
                  {item.description.split("\n").map((line) => (
                    <div className="resume-line">{line}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <h4 className="resume-section-title">Experience</h4>
          {workData.map((item) => (
            <div className="resume-card">
              <div className="resume-card-image-container">
                <img className="resume-card-image" src={require("../../assets/logos/" + item.logo).default} alt={item.logo} />
              </div>
              <div>
                <h5 className="resume-card-header">{item.jobTitle}</h5>
                <div className="resume-subtitle">
                  {item.organization} {" • "} {item.dates.rawText}
                </div>
                <div>
                  {item.jobDescription.split("\n").map((line) => (
                    <div className="resume-line">{line}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Squircle>
      </span>
      <br />
      <h4 className="project-section-title">Projects</h4>
      <div className="project-cards-container">
        {projectData.map((item) => (
          <span className="project-card-wrapper">
            <Squircle className="project-card" href={item.link} as="a" cornerRadius={40}>
              <div>
                <h5 className="project-card-header">{item.project}</h5>
                <div className="project-subtitle">{item.dates.rawText}</div>
                <div>
                  {item.projectDescription.split("\n").map((line) => (
                    <div className="project-line">{line}</div>
                  ))}
                </div>
              </div>
              <div className="project-card-image-container">
                <img className="project-card-image" src={require("../../assets/logos/" + item.logo).default} alt={item.logo} />
              </div>
            </Squircle>
          </span>
        ))}
      </div>
    </div>
  );
}

export default Resume;
