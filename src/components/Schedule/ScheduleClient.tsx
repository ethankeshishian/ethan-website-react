"use client";

import dynamic from "next/dynamic";

const Schedule = dynamic(() => import("./Schedule"), { ssr: false });

export default function ScheduleClient() {
  return <Schedule />;
}
