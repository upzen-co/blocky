// Keep in sync with DEFAULTS in content.js.
const DEFAULTS = {
  xFeed: true,
  xNoAutoAdvance: false,
  xLive: false,
  ytHome: false,
  ytShorts: false,
  redditFeed: false,
  fbFeed: false,
};

chrome.storage.sync.get({ settings: DEFAULTS }, ({ settings }) => {
  settings = { ...DEFAULTS, ...settings };
  for (const key of Object.keys(DEFAULTS)) {
    const box = document.getElementById(key);
    box.checked = settings[key];
    box.addEventListener("change", () => {
      settings[key] = box.checked;
      chrome.storage.sync.set({ settings });
    });
  }
});
