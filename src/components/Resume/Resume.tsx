import React from "react";
import "./Resume.css";
import ResumeJSON from "../../assets/affinda-parser-mXLMitjA.json";

function Resume() {
  let resumeData = ResumeJSON.data;
  let educationData = resumeData.education;
  let workData = resumeData.workExperience;
  let projectData = resumeData.projects;

  return (
    <div className="resume-main-block">
      <h3>Resume</h3>
      <div className="resume-cards-container">
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
      </div>
      <br />
      <div className="resume-cards-container">
        <h4 className="resume-section-title">Work Experience</h4>
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
      </div>
      <br />
      <div className="resume-cards-container">
        <h4 className="resume-section-title">Projects</h4>
        {projectData.map((item) => (
          <div className="resume-card">
            <div>
              <h5 className="resume-card-header">{item.project}</h5>
              <div className="resume-subtitle">{item.dates.rawText}</div>
              <div>
                {item.projectDescription.split("\n").map((line) => (
                  <div className="resume-line">{line}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Resume;
