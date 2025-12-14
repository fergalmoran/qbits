# Privacy Policy for qBits

**Last updated: 14 December 2025**

## Overview

qBits is a browser extension that allows you to monitor and manage your qBittorrent server. This privacy policy explains how qBits handles your data.

## Data Collection

**qBits does not collect, store, or transmit any personal data to external servers.**

### What data is stored locally

qBits stores the following information locally in your browser's extension storage:

- **Server URL**: The address of your qBittorrent server
- **Username**: Your qBittorrent login username
- **Password**: Your qBittorrent login password
- **Preferences**: Your extension preferences (e.g., refresh interval, dark mode)

This data is stored using your browser's built-in `chrome.storage.sync` API and is only used to connect to your own qBittorrent server.

### What data is transmitted

qBits only communicates with:

1. **Your qBittorrent server** - The extension connects exclusively to the server URL you configure in the settings. This connection is used to:
   - Authenticate with your server
   - Retrieve torrent status and information
   - Add new torrents
   - Manage existing torrents

**No data is ever sent to the extension developer, third-party analytics services, or any other external servers.**

## Permissions Explained

### "Access your data for all websites"

This permission is required because qBittorrent servers can be hosted on any URL:
- Local network addresses (e.g., `192.168.1.100:8080`)
- Custom domains (e.g., `qbit.mydomain.com`)
- Various ports and protocols

The extension **only** connects to the single server URL you configure. Despite the broad permission wording, qBits does not access, read, or interact with any other websites.

### "Storage"

Used to save your settings (server URL, credentials, preferences) locally in your browser.

### "Context Menus"

Used to add the "Send to qBittorrent" option when you right-click on torrent links.

## Data Security

- Your credentials are stored locally in your browser's secure extension storage
- Credentials are never transmitted anywhere except to your own qBittorrent server
- All communication with your qBittorrent server uses the protocol you specify (HTTP/HTTPS)
- We recommend using HTTPS if your qBittorrent server is accessible over the internet

## Third-Party Services

qBits does not use any third-party services, analytics, tracking, or advertising.

## Open Source

qBits is open source software. You can review the complete source code at:
https://github.com/fergalmoran/qbits

## Children's Privacy

qBits does not knowingly collect any information from children under 13 years of age.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date at the top of this document. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Contact

If you have any questions about this privacy policy or qBits, please open an issue on our GitHub repository:
https://github.com/fergalmoran/qbits/issues

---

## Summary

- ✅ All data stays on your device and your qBittorrent server
- ✅ No analytics or tracking
- ✅ No data sold or shared with third parties
- ✅ Open source and auditable
- ❌ No external servers or proxies
- ❌ No data collection whatsoever
