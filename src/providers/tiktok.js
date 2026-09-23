import { createUnavailableProvider } from "./unavailable";

export const tiktokProvider = createUnavailableProvider({
  id: "tiktok",
  label: "TikTok",
  hosts: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com"],
});
