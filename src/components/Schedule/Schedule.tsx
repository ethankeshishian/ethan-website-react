"use client";

import React from "react";
import { InlineWidget } from "react-calendly";
import "./Schedule.css";
import { CALENDLY } from "../../constants";

function Schedule() {
  return (
    <div className="schedule-container">
      <InlineWidget url={CALENDLY} styles={{ height: "calc(100vh - 140px)", padding: "135px 0px 0px" }} />
    </div>
  );
}

export default Schedule;
