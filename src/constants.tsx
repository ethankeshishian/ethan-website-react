import ReactGA from "react-ga";

export const LINKEDIN_LINK = "https://linkedin.com/in/ethankeshishian";
export const GITHUB_LINK = "https://github.com/ethankeshishian";
export const TWITTER_LINK = "https://twitter.com/ethankeshishian";
export const INSTAGRAM_LINK = "https://instagram.com/ethankeshishian";
export const SPOTIFY_LINK = "https://open.spotify.com/user/baklou";
export const EMAIL_LINK = "mailto:ethan@ethank.tech";

export const UNICORNER_LINK = "https://unicorner.news";
export const SPOTCLUB_LINK = "https://spotclub.live";

export enum buttonType {
  Round = "round",
  Footer = "footer",
}
export enum linkType {
  Linkedin = "LinkedIn",
  Github = "GitHub",
  Twitter = "Twitter",
  Instagram = "Instagram",
  Spotify = "Spotify",
  Email = "Email",
}

export function linkEvent(site: string, type: string) {
  let action = `User pressed the ${type} button`;
  let label = `${site}`;
  ReactGA.event({
    category: "Clicked Link",
    action: action,
    label: label,
  });
}

export const CALENDLY = "https://calendly.com/ethan_k/30min";
export const ZOOM = "https://mercury.zoom.us/j/7298178714?pwd=IoAS3aOgcQuLvoEdVL4mVINyn4bPqo.1";
