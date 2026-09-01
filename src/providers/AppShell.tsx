"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/reducers";
import Header from "../components/Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const imageLoaded = useSelector(
    (state: RootState) => state.readyToLoad.imageLoaded
  );

  // Reveal the app on mount. The old CRA build gated on the profile photo's
  // onload; under SSR the markup is already present, so a mount effect gives the
  // same "fade in once ready" behavior on every route (About, Schedule, 404).
  useEffect(() => {
    dispatch({ type: "EDIT_IMAGE_LOADED", payload: true });
  }, [dispatch]);

  return (
    <div className={imageLoaded ? "App app-fade" : "App notReadyToLoad"}>
      <div className="header">
        <Header />
      </div>
      <div className="body">{children}</div>
    </div>
  );
}
