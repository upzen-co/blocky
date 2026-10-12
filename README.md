# Blocky

A browser extension that hides your feeds until you choose to reveal them, and only for a few minutes at a time.

Open X to post something, and the feed isn't there to pull you in. The compose box, search, notifications, messages and profiles all work as normal. If you do want to scroll, click **Show for 5 / 10 / 15 min**. When the time's up, the feed hides itself again.

The same timed lock is available for the YouTube homepage, Reddit's home and Popular feeds, and the Facebook News Feed. Blocky can also hide YouTube Shorts and X Spaces and live broadcasts entirely, and lock X's swipe-through video viewer to the video you opened.

## Features

Turn each one on or off from Blocky's toolbar button. Changes apply to open tabs straight away.

| Site | Setting | Default |
| --- | --- | --- |
| X | Hide home feed, with the sidebar's trends and "Who to follow" (timed reveal) | On |
| X | Lock the swipe-through video viewer to the video you opened: it loops instead of auto-advancing, and swiping to other videos is blocked | Off |
| X | Hide Spaces and live broadcasts | Off |
| YouTube | Hide the homepage feed (timed reveal) | Off |
| YouTube | Hide Shorts shelves, Shorts results and the Shorts tab, and open any `/shorts/` link as a normal video | Off |
| Reddit | Hide the home, Best/Hot/New/Top, Popular and All feeds, on new and old Reddit (timed reveal) | Off |
| Facebook | Hide the News Feed (timed reveal) | Off |

- Reveal for 5, 10 or 15 minutes, with a countdown and a **Hide now** button
- One timer per site, shared across that site's tabs, so reloading doesn't reset it
- No tracking, no network requests, no accounts. The only things stored are your settings and each site's reveal expiry time, kept in your browser.

## Install (Brave, Chrome, Edge, Arc)

1. Download this repo (**Code → Download ZIP**) and unzip it, or `git clone` it.
2. Open the extensions page: `brave://extensions`, `chrome://extensions`, `edge://extensions` or `arc://extensions`.
3. Turn on **Developer mode** (top right in Brave, Chrome and Arc; left sidebar in Edge).
4. Click **Load unpacked** and select the unzipped folder (`blocky-main` from a ZIP, `blocky` from a clone): the one that contains `manifest.json`.
5. Refresh any open X, YouTube, Reddit or Facebook tabs.
6. Optional: pin Blocky to the toolbar to reach its settings.

## Brave on iPhone and iPad

Extensions don't run in Brave on iOS, so [`filters/brave-ios.txt`](filters/brave-ios.txt) has filter rules that do the same hiding (without the timed reveal). In Brave, go to **Settings → Shields & Privacy → Content Filtering** and either add the file's raw GitHub URL as a custom filter list (it stays up to date) or paste the rules into **Create Custom Filters**. They work on the sites opened in Brave, not in the X, YouTube, Reddit or Facebook apps.

## Customise

Change the reveal durations by editing `DURATIONS_MIN` at the top of `content.js`, then click the reload icon on Blocky's card in the extensions page.

## Notes

None of these sites publish a stable page structure. Blocky finds each feed by the page's own element names and `data-testid` / `role` attributes, so if a site changes its layout and something reappears, update the selectors in the `SITES` list in `content.js` and in `blocky.css`.

---

Made by [upzen](https://upzen.co).
