// Blocky: hide feeds (X, YouTube, Reddit, Facebook) until the user reveals
// them for a fixed number of minutes, and optionally hide Shorts / video /
// live content outright. Each site's unlock expiry lives in chrome.storage so
// every tab of that site shares it; settings live in chrome.storage.sync.
(() => {
  const DURATIONS_MIN = [5, 10, 15];

  // Keep in sync with DEFAULTS in popup.js.
  const DEFAULTS = {
    xFeed: true,
    xNoAutoAdvance: false,
    xLive: false,
    ytHome: false,
    ytShorts: false,
    redditFeed: false,
    fbFeed: false,
  };

  // feedSetting: the toggle that turns the timed feed lock on for this site.
  // isFeedPage: paths where the feed lives. feed: the element to hide; the
  // panel is inserted just before the first match. toggles: extra settings
  // that are pure CSS (see blocky.css) and get an html class when on.
  const SITES = [
    {
      id: "x",
      host: /(^|\.)(x|twitter)\.com$/,
      feedSetting: "xFeed",
      // "/" and "/home" are the feed; "/compose/..." is the post modal drawn over it.
      isFeedPage: (p) => /^\/(home\/?)?$|^\/compose\//.test(p),
      feed: '[data-testid="primaryColumn"] section[role="region"]',
      toggles: ["xLive", "xNoAutoAdvance"],
    },
    {
      id: "youtube",
      host: /(^|\.)youtube\.com$/,
      feedSetting: "ytHome",
      isFeedPage: (p) => p === "/",
      // Desktop keeps other pages' ytd-browse in the DOM, so pin to "home".
      feed: 'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer, ytm-browse ytm-rich-grid-renderer',
      toggles: ["ytShorts"],
    },
    {
      id: "reddit",
      host: /(^|\.)reddit\.com$/,
      feedSetting: "redditFeed",
      isFeedPage: (p) => /^\/((best|hot|new|top|rising)\/?)?$|^\/r\/(popular|all)(\/|$)/.test(p),
      // shreddit-feed: new Reddit. #siteTable: old.reddit.com.
      feed: "shreddit-feed, #siteTable",
      toggles: [],
    },
    {
      id: "facebook",
      host: /(^|\.)facebook\.com$/,
      feedSetting: "fbFeed",
      isFeedPage: (p) => /^\/(home\.php)?$/.test(p),
      feed: '[role="main"] [role="feed"]',
      toggles: [],
    },
  ];

  const site = SITES.find((s) => s.host.test(location.hostname));
  if (!site) return;

  const UNLOCK_KEY = `unlockUntil.${site.id}`;
  const root = document.documentElement;
  root.classList.add(`blocky-${site.id}`);

  let settings = { ...DEFAULTS };
  let unlockUntil = 0;
  let wasLocked = true;
  let relockTimer = null;
  let tickTimer = null;
  let frame = null;

  const isFeedPage = () => site.isFeedPage(location.pathname);
  const isUnlocked = () => Date.now() < unlockUntil;

  function setUnlockUntil(ts) {
    try {
      chrome.storage.local.set({ [UNLOCK_KEY]: ts });
    } catch {
      // Extension was reloaded; this page's script is orphaned. Refresh fixes it.
    }
  }

  function el(tag, props = {}, children = []) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  }

  function buildPanel() {
    const buttons = DURATIONS_MIN.map((m) =>
      el("button", {
        type: "button",
        textContent: `Show for ${m} min`,
        onclick: () => setUnlockUntil(Date.now() + m * 60_000),
      })
    );
    return el("div", { id: "blocky-panel" }, [
      el("h2", { textContent: "Feed hidden by Blocky" }),
      el("p", { textContent: "You came here to do something. Do that first." }),
      el("div", { className: "blocky-buttons" }, buttons),
    ]);
  }

  function ensurePanel() {
    const feed = document.querySelector(site.feed);
    if (!feed) return;
    if (feed.previousElementSibling?.id === "blocky-panel") return;
    document.getElementById("blocky-panel")?.remove();
    feed.before(buildPanel());
  }

  function formatRemaining() {
    const secs = Math.max(0, Math.ceil((unlockUntil - Date.now()) / 1000));
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  }

  function ensurePill() {
    let pill = document.getElementById("blocky-pill");
    if (!pill && document.body) {
      pill = el("div", { id: "blocky-pill" }, [
        el("span", { className: "blocky-time" }),
        el("button", {
          type: "button",
          textContent: "Hide now",
          onclick: () => setUnlockUntil(0),
        }),
      ]);
      document.body.append(pill);
    }
    if (!pill) return;
    const label = pill.querySelector(".blocky-time");
    const text = `Feed visible · ${formatRemaining()}`;
    // Only write when it changes: every write is a DOM mutation.
    if (label.textContent !== text) label.textContent = text;
  }

  // YouTube Shorts: /shorts/<id> plays the same video as /watch?v=<id>, but
  // without the swipe-to-next-short player.
  function redirectShorts() {
    const m = location.pathname.match(/^\/shorts\/([\w-]+)/);
    if (m) location.replace(`/watch?v=${m[1]}`);
    return !!m;
  }

  // X's swipe-through video viewer (/<user>/status/<id>/mediaviewer) moves
  // on to the next video when one ends. Looping means it never ends, so you
  // only move on by swiping. Same approach as Control Panel for Twitter.
  function loopViewerVideos() {
    for (const v of document.querySelectorAll('[data-testid="vss-scroll-view"] video')) {
      if (!v.loop) v.loop = true;
    }
  }

  function render() {
    frame = null;
    for (const t of site.toggles) root.classList.toggle(`blocky-${t}`, settings[t]);
    if (site.id === "youtube" && settings.ytShorts && redirectShorts()) return;
    if (site.id === "x" && settings.xNoAutoAdvance) loopViewerVideos();

    const onFeed = settings[site.feedSetting] && isFeedPage();
    const locked = onFeed && !isUnlocked();

    root.classList.toggle("blocky-locked", locked);
    if (locked) {
      ensurePanel();
      // Time ran out mid-scroll: jump back to the top so the panel is in view.
      if (!wasLocked) window.scrollTo(0, 0);
    } else {
      document.getElementById("blocky-panel")?.remove();
    }

    if (onFeed && !locked) ensurePill();
    else document.getElementById("blocky-pill")?.remove();

    wasLocked = locked;
  }

  function scheduleRender() {
    if (frame === null) frame = requestAnimationFrame(render);
  }

  // Mutations caused by Blocky's own panel/pill must not trigger another
  // render, or render -> mutation -> render loops every frame.
  const OWN = "#blocky-panel, #blocky-pill";
  const isOwn = (node) =>
    node.id === "blocky-panel" ||
    node.id === "blocky-pill" ||
    !!(node.nodeType === 1 ? node : node.parentElement)?.closest(OWN);

  function onMutations(records) {
    const external = records.some(
      (r) =>
        !isOwn(r.target) &&
        ![...r.addedNodes, ...r.removedNodes].every(isOwn)
    );
    if (external) scheduleRender();
  }

  function armTimers() {
    clearTimeout(relockTimer);
    clearInterval(tickTimer);
    if (isUnlocked()) {
      relockTimer = setTimeout(render, unlockUntil - Date.now() + 50);
      tickTimer = setInterval(() => {
        if (isUnlocked()) render();
        else clearInterval(tickTimer);
      }, 1000);
    }
    render();
  }

  // Lock synchronously at document_start so the feed never flashes on load;
  // the stored settings and expiry (read async) may then unlock it.
  if (isFeedPage()) root.classList.add("blocky-locked");

  let loaded = 0;
  const onLoaded = () => {
    if (++loaded < 2) return;
    wasLocked = !isUnlocked();
    armTimers();
  };
  chrome.storage.sync.get({ settings: DEFAULTS }, (data) => {
    settings = { ...DEFAULTS, ...data.settings };
    onLoaded();
  });
  chrome.storage.local.get(UNLOCK_KEY, (data) => {
    unlockUntil = data[UNLOCK_KEY] || 0;
    onLoaded();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (loaded < 2) return;
    if (area === "sync" && changes.settings) {
      settings = { ...DEFAULTS, ...changes.settings.newValue };
      render();
    }
    if (area === "local" && changes[UNLOCK_KEY]) {
      unlockUntil = changes[UNLOCK_KEY].newValue || 0;
      armTimers();
    }
  });

  // These sites are single-page apps: re-check on every DOM change (throttled
  // to one pass per frame) to catch client-side navigation and re-rendered feeds.
  new MutationObserver(onMutations).observe(root, {
    childList: true,
    subtree: true,
  });
  window.addEventListener("popstate", scheduleRender);
  document.addEventListener("visibilitychange", scheduleRender);
})();
