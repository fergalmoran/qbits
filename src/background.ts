import { handleQBittorrentAPI } from "./api";

// Set up declarativeNetRequest rules to remove Origin header for qBittorrent API calls
function setupDeclarativeNetRequestRules() {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType,
          requestHeaders: [
            {
              header: "Origin",
              operation: "remove" as chrome.declarativeNetRequest.HeaderOperation,
            },
          ],
        },
        condition: {
          urlFilter: "*/api/v2/*",
          resourceTypes: [
            "xmlhttprequest" as chrome.declarativeNetRequest.ResourceType,
          ],
        },
      },
    ],
  }).then(() => {
    console.log("declarativeNetRequest rules set up successfully");
  }).catch((error) => {
    console.error("Failed to set up declarativeNetRequest rules:", error);
  });
}

// Set up rules immediately when service worker starts
setupDeclarativeNetRequestRules();

// Badge colors
const BADGE_COLOR_SUCCESS = "#6366f1"; // Indigo - for download count
const BADGE_COLOR_WARNING = "#f59e0b"; // Amber - no settings configured
const BADGE_COLOR_ERROR = "#ef4444";   // Red - connection error

// Update badge with current download count or status
async function updateBadge() {
  try {
    const result = await chrome.storage.sync.get(["settings"]);
    const settings = result.settings;

    // No server URL configured - show warning badge
    if (!settings?.serverUrl) {
      chrome.action.setBadgeText({ text: "?" });
      chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR_WARNING });
      chrome.action.setTitle({ title: "qBits - No server configured" });
      return;
    }

    // Server URL exists but missing credentials - show warning
    if (!settings?.username || !settings?.password) {
      chrome.action.setBadgeText({ text: "?" });
      chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR_WARNING });
      chrome.action.setTitle({ title: "qBits - Missing credentials" });
      return;
    }

    // Login first
    const loginResponse = await handleQBittorrentAPI({
      action: "login",
      serverUrl: settings.serverUrl,
      username: settings.username,
      password: settings.password,
    });

    if (!loginResponse.ok) {
      // Connection failed - show error badge
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR_ERROR });
      chrome.action.setTitle({ title: "qBits - Connection failed" });
      return;
    }

    // Get torrents
    const torrentsResponse = await handleQBittorrentAPI({
      action: "getTorrents",
      serverUrl: settings.serverUrl,
    });

    if (torrentsResponse.ok && Array.isArray(torrentsResponse.body)) {
      const downloadingCount = torrentsResponse.body.filter(
        (t: any) => t.state.includes("downloading") || t.state.includes("DL")
      ).length;

      chrome.action.setBadgeText({ text: downloadingCount > 0 ? downloadingCount.toString() : "" });
      chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR_SUCCESS });
      chrome.action.setTitle({ title: downloadingCount > 0 ? `qBits - ${downloadingCount} downloading` : "qBits" });
    } else {
      // Failed to get torrents - show error badge
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR_ERROR });
      chrome.action.setTitle({ title: "qBits - Failed to fetch torrents" });
    }
  } catch (error) {
    console.error("Error updating badge:", error);
    // Network or other error - show error badge
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR_ERROR });
    chrome.action.setTitle({ title: "qBits - Connection error" });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sendToQBittorrent",
    title: "Send to qBittorrent",
    contexts: ["link"]
  });

  // Set up declarativeNetRequest rules
  setupDeclarativeNetRequestRules();

  // Start badge update interval
  updateBadge();
  setInterval(updateBadge, 5000); // Update every 5 seconds
});

chrome.contextMenus.onClicked.addListener(async (info, _tab) => {
  if (info.menuItemId === "sendToQBittorrent" && info.linkUrl) {
    try {
      // Load settings from storage
      const result = await chrome.storage.sync.get(["settings"]);
      const settings = result.settings;

      if (!settings?.serverUrl || !settings?.username || !settings?.password) {
        console.error("qBittorrent server not configured");
        return;
      }

      // Login first
      const loginResponse = await handleQBittorrentAPI({
        action: "login",
        serverUrl: settings.serverUrl,
        username: settings.username,
        password: settings.password,
      });

      if (!loginResponse.ok) {
        console.error("Failed to authenticate with qBittorrent server");
        return;
      }

      // Add torrent
      const addResponse = await handleQBittorrentAPI({
        action: "addTorrent",
        serverUrl: settings.serverUrl,
        url: info.linkUrl,
      });

      if (addResponse.ok) {
        console.log("Torrent added successfully");
        // Update badge immediately after adding torrent
        setTimeout(updateBadge, 1000);
      } else {
        console.error("Failed to add torrent:", addResponse.error);
      }
    } catch (error) {
      console.error("Error adding torrent:", error);
    }
  }
});

// Handle API requests from the popup/options page
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "qbittorrent-api") {
    handleQBittorrentAPI(message.payload)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true; // Keep the message channel open for async response
  }

  if (message.type === "update-badge") {
    const count = message.count || 0;
    chrome.action.setBadgeText({ text: count > 0 ? count.toString() : "" });
    chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR_SUCCESS });
    sendResponse({ success: true });
    return true;
  }
});
