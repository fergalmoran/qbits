interface APIPayload {
  action: string;
  serverUrl: string;
  username?: string;
  password?: string;
  [key: string]: unknown;
}

interface APIResponse<T = unknown> {
  ok: boolean;
  status: number;
  body: T;
  error?: string;
}

/**
 * Handle qBittorrent API requests from the popup/options page
 * This runs in the background service worker context
 */
export async function handleQBittorrentAPI(payload: APIPayload): Promise<APIResponse> {
  const { action, serverUrl } = payload;

  switch (action) {
    case "login":
      return handleLogin(payload);
    case "getTorrents":
      return handleGetTorrents(payload);
    case "getPreferences":
      return handleGetPreferences(payload);
    case "getVersion":
      return handleGetVersion(payload);
    case "addTorrent":
      return handleAddTorrent(payload);
    case "pauseTorrent":
      return handlePauseTorrent(payload);
    case "resumeTorrent":
      return handleResumeTorrent(payload);
    case "deleteTorrent":
      return handleDeleteTorrent(payload);
    default:
      return {
        ok: false,
        status: 400,
        body: null,
        error: `Unknown action: ${action}`,
      };
  }
}

async function handleLogin(payload: APIPayload): Promise<APIResponse<string>> {
  const { serverUrl, username, password } = payload;

  try {
    const response = await fetch(`${serverUrl}/api/v2/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
      body: `username=${username}&password=${password}`,
    });

    const responseText = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      body: responseText,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: "",
      error: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

async function handleGetTorrents(payload: APIPayload): Promise<APIResponse<unknown[]>> {
  const { serverUrl } = payload;

  try {
    const response = await fetch(`${serverUrl}/api/v2/torrents/info`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        body: [],
        error: `Failed to get torrents: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      body: data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: [],
      error: `Failed to get torrents: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

async function handleGetPreferences(payload: APIPayload): Promise<APIResponse<unknown>> {
  const { serverUrl } = payload;

  try {
    const response = await fetch(`${serverUrl}/api/v2/app/preferences`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      body: data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: `Failed to get preferences: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

async function handleGetVersion(payload: APIPayload): Promise<APIResponse<string>> {
  const { serverUrl } = payload;

  try {
    const response = await fetch(`${serverUrl}/api/v2/app/version`, {
      method: "GET",
      credentials: "include",
    });

    const version = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      body: version,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: "",
      error: `Failed to get version: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

async function handleAddTorrent(payload: APIPayload): Promise<APIResponse<string>> {
  const { serverUrl, url } = payload;

  try {
    const formData = new URLSearchParams();
    formData.append("urls", url as string);

    const response = await fetch(`${serverUrl}/api/v2/torrents/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
      body: formData.toString(),
    });

    const responseText = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      body: responseText,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: "",
      error: `Failed to add torrent: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

async function handlePauseTorrent(payload: APIPayload): Promise<APIResponse<string>> {
  const { serverUrl, hash } = payload;

  try {
    const formData = new URLSearchParams();
    formData.append("hashes", hash as string);

    const response = await fetch(`${serverUrl}/api/v2/torrents/pause`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
      body: formData.toString(),
    });

    const responseText = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      body: responseText,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: "",
      error: `Failed to pause torrent: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

async function handleResumeTorrent(payload: APIPayload): Promise<APIResponse<string>> {
  const { serverUrl, hash } = payload;

  try {
    const formData = new URLSearchParams();
    formData.append("hashes", hash as string);

    const response = await fetch(`${serverUrl}/api/v2/torrents/resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
      body: formData.toString(),
    });

    const responseText = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      body: responseText,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: "",
      error: `Failed to resume torrent: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

async function handleDeleteTorrent(payload: APIPayload): Promise<APIResponse<string>> {
  const { serverUrl, hash, deleteFiles } = payload;

  try {
    const formData = new URLSearchParams();
    formData.append("hashes", hash as string);
    formData.append("deleteFiles", deleteFiles ? "true" : "false");

    const response = await fetch(`${serverUrl}/api/v2/torrents/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
      body: formData.toString(),
    });

    const responseText = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      body: responseText,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: "",
      error: `Failed to delete torrent: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
