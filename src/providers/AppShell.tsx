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
  const darkMode = useSelector((state: RootState) => state.colorTheme.darkMode);

  // Reveal the app on mount (was: profile-photo onload in the CRA build).
  useEffect(() => {
    dispatch({ type: "EDIT_IMAGE_LOADED", payload: true });
  }, [dispatch]);

  // Keep the <body> theme class in sync with Redux.
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  return (
    <div className={imageLoaded ? "App app-fade" : "App notReadyToLoad"}>
      <div className="header">
        <Header />
      </div>
      <div className="body">{children}</div>
    </div>
  );
}
