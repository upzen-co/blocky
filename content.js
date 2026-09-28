// Blocky: hide the X home feed until the user reveals it for a fixed number
// of minutes. The unlock expiry lives in chrome.storage so every X tab shares it.
(() => {
  const DURATIONS_MIN = [5, 10, 15];
  const TIMELINE = '[data-testid="primaryColumn"] section[role="region"]';

  let unlockUntil = 0;
  let wasLocked = true;
  let relockTimer = null;
  let tickTimer = null;
  let frame = null;

  // "/" and "/home" are the feed; "/compose/..." is the post modal drawn over it.
  const isFeedPage = () => /^\/(home\/?)?$|^\/compose\//.test(location.pathname);
  const isUnlocked = () => Date.now() < unlockUntil;

  function setUnlockUntil(ts) {
    try {
      chrome.storage.local.set({ unlockUntil: ts });
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
    const timeline = document.querySelector(TIMELINE);
    if (!timeline) return;
    if (timeline.previousElementSibling?.id === "blocky-panel") return;
    document.getElementById("blocky-panel")?.remove();
    timeline.before(buildPanel());
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

  function render() {
    frame = null;
    const onFeed = isFeedPage();
    const locked = onFeed && !isUnlocked();

    document.documentElement.classList.toggle("blocky-locked", locked);
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
  // the stored expiry (read async) may then unlock it.
  if (isFeedPage()) document.documentElement.classList.add("blocky-locked");

  chrome.storage.local.get("unlockUntil", (data) => {
    unlockUntil = data.unlockUntil || 0;
    wasLocked = !isUnlocked();
    armTimers();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.unlockUntil) return;
    unlockUntil = changes.unlockUntil.newValue || 0;
    armTimers();
  });

  // X is a single-page app: re-check on every DOM change (throttled to one
  // pass per frame) to catch client-side navigation and re-rendered timelines.
  new MutationObserver(onMutations).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.addEventListener("popstate", scheduleRender);
  document.addEventListener("visibilitychange", scheduleRender);
})();
