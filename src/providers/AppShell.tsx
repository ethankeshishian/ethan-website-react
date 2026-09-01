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

  // Keep the theme classes in sync with Redux. `html.theme-dark` (set by the
  // pre-paint layout script) is kept in lockstep with `body.dark-mode` so the
  // <html> canvas has a dark background too — otherwise a page taller than one
  // viewport shows a light strip past the fold (the .App wrapper caps <body> at
  // 100vh, so <body>'s background doesn't reach the bottom).
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    document.documentElement.classList.toggle("theme-dark", darkMode);
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
