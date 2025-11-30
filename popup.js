// popup.js — display on-page + off-page results

document.addEventListener("DOMContentLoaded", () => {
  const output = document.getElementById("output");
  output.textContent = "Loading...";

  function show(onpage, offpage) {
    const payload = {
      OnPage: onpage || "No data yet",
      OffPage: offpage || { error: true, reason: "RDAP not run or failed" }
    };
    output.textContent = JSON.stringify(payload, null, 2);
  }

  // First: get stored on-page + off-page (if any)
  chrome.storage.local.get(["latestFeatures", "offpage_results"], (res) => {
    const storedOn = res.latestFeatures || null;
    const storedOff = res.offpage_results || null;
    show(storedOn, storedOff);
  });

  // Then: ask background for freshest on-page value
  chrome.runtime.sendMessage({ type: "get_latest_features" }, (resp1) => {
    const onpage = resp1?.features || null;

    // Now trigger off-page RDAP for the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].url) {
        show(onpage, null);
        return;
      }

      const domain = new URL(tabs[0].url).hostname.toLowerCase().replace(/^www\./, "");

      chrome.runtime.sendMessage(
        { type: "run_offpage_analysis", domain },
        (resp2) => {
          const offpage = resp2?.offpage || null;
          show(onpage, offpage);
        }
      );
    });
  });
});
