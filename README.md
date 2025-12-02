# React Chrome Extension

This is a Chrome Extension built with React, Vite, and Bun.

## Features

- **React-based Settings UI**: A modern settings page using React.
- **Context Menu**: Adds a "Open Extension Settings" item to the right-click menu.
- **Storage Persistence**: Saves settings using `chrome.storage.sync`.
- **Dark Mode**: Built-in dark mode support.

## Development

### Prerequisites

- [Bun](https://bun.sh/) installed.

### Setup

1.  Install dependencies:
    ```bash
    bun install
    ```

2.  Build the extension:
    ```bash
    bun run build
    ```

### Loading into Chrome

1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** (top right).
3.  Click **Load unpacked**.
4.  Select the `dist` folder in this project directory.

## Project Structure

- `src/App.jsx`: The Settings UI component.
- `src/background.js`: Background service worker (Context Menu logic).
- `public/manifest.json`: Extension manifest.
- `vite.config.js`: Build configuration for multiple entry points.
