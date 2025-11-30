// background.js — final clean version

import { analyzeDomain } from "./offpage.js";

let latestFeatures = null;
let latestOffPage = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // ----- STORE ON-PAGE FEATURES -----
  if (msg.type === "phiusiil_features") {
    latestFeatures = msg.data;
    chrome.storage.local.set({ latestFeatures: msg.data });
    sendResponse({ status: "stored" });
    return true;
  }

  // ----- RETURN ON-PAGE FEATURES -----
  if (msg.type === "get_latest_features") {
    sendResponse({ features: latestFeatures });
    return true;
  }

  // ----- RUN OFF-PAGE ANALYSIS (RDAP) -----
  if (msg.type === "run_offpage_analysis") {
    const cleanDomain = (msg.domain || "").toLowerCase().replace(/^www\./, "");
    if (!cleanDomain) {
      sendResponse({
        offpage: { error: true, reason: "Empty domain" }
      });
      return true;
    }

    analyzeDomain(cleanDomain)
      .then(result => {
        latestOffPage = result;
        chrome.storage.local.set({ offpage_results: result });
        sendResponse({ offpage: result });
      })
      .catch(err => {
        latestOffPage = { error: true, reason: "RDAP lookup failed" };
        sendResponse({ offpage: latestOffPage });
      });

    return true; // keep message channel open for async response
  }

  // ----- RETURN LAST OFF-PAGE RESULT -----
  if (msg.type === "get_offpage_results") {
    sendResponse({ offpage: latestOffPage });
    return true;
  }
});
