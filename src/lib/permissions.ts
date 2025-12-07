/**
 * Permission utilities for requesting host access to qBittorrent servers
 * 
 * Note: We use required host_permissions in manifest.json for reliability.
 * Optional permissions with declarativeNetRequest have timing issues where
 * rules don't apply immediately to existing contexts.
 */

/**
 * Check if a server URL is valid
 */
export function isValidServerUrl(serverUrl: string): boolean {
  try {
    new URL(serverUrl);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if we have permission for a specific server URL
 */
export async function hasHostPermission(serverUrl: string): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.permissions) {
    // Mock mode for development
    return true;
  }

  try {
    const url = new URL(serverUrl);
    const origin = `${url.protocol}//${url.host}/*`;

    return await chrome.permissions.contains({
      origins: [origin],
    });
  } catch {
    return false;
  }
}

/**
 * Revoke permission for a server URL (optional, for cleanup)
 */
export async function revokeHostPermission(serverUrl: string): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.permissions) {
    return true;
  }

  try {
    const url = new URL(serverUrl);
    const origin = `${url.protocol}//${url.host}/*`;

    return await chrome.permissions.remove({
      origins: [origin],
    });
  } catch {
    return false;
  }
}
