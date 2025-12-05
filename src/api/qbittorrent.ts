import type { Torrent } from "../types/torrent";

export interface QBittorrentConfig {
  serverUrl: string;
  username: string;
  password: string;
}

export interface APIResponse<T = unknown> {
  ok: boolean;
  status: number;
  body: T;
  error?: string;
}

/**
 * qBittorrent API service
 * All API calls are routed through the background service worker
 * to avoid CORS issues with the chrome-extension:// origin
 */
export class QBittorrentAPI {
  private config: QBittorrentConfig;

  constructor(config: QBittorrentConfig) {
    this.config = config;
  }

  /**
   * Send a message to the background service worker to make an API call
   */
  private async sendMessage<T>(
    action: string,
    additionalPayload?: Record<string, unknown>
  ): Promise<APIResponse<T>> {
    try {
      // Check if chrome.runtime is available
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error("Chrome extension API is not available. Make sure you're running as an extension.");
      }

      const response = await chrome.runtime.sendMessage({
        type: "qbittorrent-api",
        payload: {
          action,
          serverUrl: this.config.serverUrl,
          username: this.config.username,
          password: this.config.password,
          ...additionalPayload,
        },
      });

      return response;
    } catch (error) {
      return {
        ok: false,
        status: 0,
        body: null as T,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async login(): Promise<APIResponse<string>> {
    return this.sendMessage<string>("login");
  }

  async getTorrents(): Promise<APIResponse<Torrent[]>> {
    return this.sendMessage<Torrent[]>("getTorrents");
  }

  async getPreferences(): Promise<APIResponse<unknown>> {
    return this.sendMessage<unknown>("getPreferences");
  }

  async getVersion(): Promise<APIResponse<string>> {
    return this.sendMessage<string>("getVersion");
  }

  async addTorrentFromUrl(url: string): Promise<APIResponse<string>> {
    return this.sendMessage<string>("addTorrent", { url });
  }

  async pauseTorrent(hash: string): Promise<APIResponse<string>> {
    return this.sendMessage<string>("pauseTorrent", { hash });
  }

  async resumeTorrent(hash: string): Promise<APIResponse<string>> {
    return this.sendMessage<string>("resumeTorrent", { hash });
  }

  async deleteTorrent(hash: string, deleteFiles: boolean): Promise<APIResponse<string>> {
    return this.sendMessage<string>("deleteTorrent", { hash, deleteFiles });
  }
}
