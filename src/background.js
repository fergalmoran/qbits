chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openSettings",
    title: "Open Extension Settings",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openSettings") {
    chrome.runtime.openOptionsPage();
  }
});
