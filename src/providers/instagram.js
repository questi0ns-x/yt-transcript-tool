import { createUnavailableProvider } from "./unavailable";

export const instagramProvider = createUnavailableProvider({
  id: "instagram",
  label: "Instagram",
  hosts: ["instagram.com", "www.instagram.com"],
  pathIsVideo: (url) =>
    /^\/(reel|reels|p|tv)\//.test(url.pathname),
});
