# qBits

A browser extension for monitoring your qBittorrent client. Supports both Chrome and Firefox.

## Features

- **Quick Torrent Overview**: View all your torrents at a glance from the browser toolbar popup
- **Real-time Monitoring**: See download/upload progress with auto-refreshing status
- **Torrent Management**: Pause, resume, and delete torrents directly from the extension
- **Filter by Status**: Quickly filter torrents by all, downloading, seeding, or completed
- **Easy Setup**: Simple configuration to connect to your qBittorrent Web UI

## Development

### Prerequisites

- [Bun](https://bun.sh/) installed.

### Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Build the extension:

   ```bash
   bun run build:all
   ```

   Or build for a specific browser:

   ```bash
   bun run build:chrome
   bun run build:firefox
   ```

### Loading into Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `dist` folder in this project directory.

### Loading into Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select any file in the `dist` folder (e.g., `manifest.json`).

## Releasing

To create a new release:

```bash
bun run release           # Patch version bump (1.0.0 → 1.0.1)
bun run release:minor     # Minor version bump (1.0.0 → 1.1.0)
bun run release:major     # Major version bump (1.0.0 → 2.0.0)
```

Then push to trigger the GitHub release:

```bash
git push && git push --tags
```

The GitHub release will include both Chrome and Firefox extension zips as downloadable assets.

## Publishing

The extension can be automatically published to Chrome Web Store and Firefox Add-ons using GitHub Actions.

### Trigger Publishing

1. **On Tag Push**: Create and push a version tag (e.g., `git tag v1.0.0 && git push origin v1.0.0`)
2. **Manual Dispatch**: Go to Actions → "Build and Publish Extension" → Run workflow

### Required Secrets

Configure these secrets in your repository settings (Settings → Secrets and variables → Actions):

#### Chrome Web Store

| Secret | Description |
|--------|-------------|
| `CHROME_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console |
| `CHROME_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `CHROME_REFRESH_TOKEN` | OAuth 2.0 Refresh Token |
| `CHROME_EXTENSION_ID` | Your extension ID from Chrome Web Store |

**Getting Chrome credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the Chrome Web Store API
3. Create OAuth 2.0 credentials (select "Web application" type)
4. Add `https://developers.google.com/oauthplayground` as an authorized redirect URI
5. Use the [OAuth Playground](https://developers.google.com/oauthplayground/) to get a refresh token:
   - Click the gear icon → Enable "Use your own OAuth credentials"
   - Enter your Client Ihttps://www.googleapis.com/auth/chromewebstoreD and Secret
   - Authorize the `` scope
   - Exchange the authorization code for a refresh token

#### Firefox Add-ons

| Secret | Description |
|--------|-------------|
| `FIREFOX_ADDON_ID` | Your add-on ID (e.g., `qbits@extension` or a GUID) |
| `FIREFOX_API_ISSUER` | JWT issuer from AMO API credentials |
| `FIREFOX_API_SECRET` | JWT secret from AMO API credentials |

**Getting Firefox credentials:**

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Navigate to Tools → Manage API Keys
3. Generate new credentials for the Add-ons API
