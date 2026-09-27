# Blocky

A browser extension that hides the X (Twitter) home feed until you choose to reveal it, and only for a few minutes at a time.

Open X to post something, and the feed isn't there to pull you in. The compose box, search, notifications, messages and profiles all work as normal. If you do want to scroll, click **Show for 5 / 10 / 15 min**. When the time's up, the feed hides itself again.

## Features

- Home feed hidden by default, along with the sidebar's trends and "Who to follow"
- Reveal for 5, 10 or 15 minutes, with a countdown and a **Hide now** button
- One timer shared across all your X tabs, so reloading doesn't reset it
- No tracking, no network requests, no accounts. The only thing stored is the reveal expiry time, kept locally in your browser.

## Install (Brave, Chrome, Edge, Arc)

1. Download this repo (**Code → Download ZIP**) and unzip it, or `git clone` it.
2. Open `brave://extensions` (or `chrome://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `Blocky` folder.
5. Refresh any open X tabs.

## Customise

Change the reveal durations by editing `DURATIONS_MIN` at the top of `content.js`, then click the reload icon on Blocky's card in the extensions page.

## Notes

X doesn't publish a stable page structure. Blocky finds the feed using the page's `data-testid` attributes, so if X changes its layout and the feed reappears, update the selectors in `content.js` and `blocky.css`.

---

Made by [upzen](https://upzen.co).
