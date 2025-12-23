import { useState, useEffect, useRef, useMemo } from "react";
import { QBittorrentAPI } from "../../api";
import type { Torrent } from "../../types/torrent";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Settings, Download, Upload, Loader2, AlertCircle, Inbox, Pause, Play, Trash2, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface SettingsType {
  serverUrl: string;
  username: string;
  password: string;
}

type TabType = "all" | "downloading" | "seeding" | "completed";

function Popup() {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ hash: string; name: string } | null>(null);
  const [deleteWithFiles, setDeleteWithFiles] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem("qbits-active-tab");
    return (saved as TabType) || "all";
  });
  const hasLoadedOnce = useRef(false);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("qbits-active-tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    loadTorrents();

    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      loadTorrents();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadTorrents = async () => {
    const isFirstLoad = !hasLoadedOnce.current;

    try {
      // Load settings from storage (only on initial load)
      let storedSettings = settings;
      if (!storedSettings) {
        const result = await chrome.storage.sync.get(["settings"]);
        storedSettings = result.settings as SettingsType;

        if (!storedSettings?.serverUrl || !storedSettings?.username || !storedSettings?.password) {
          setError("Please configure your qBittorrent server in the extension settings");
          setLoading(false);
          hasLoadedOnce.current = true;
          return;
        }

        setSettings(storedSettings);
      }

      const api = new QBittorrentAPI({
        serverUrl: storedSettings.serverUrl,
        username: storedSettings.username,
        password: storedSettings.password,
      });

      // Login first (only on initial load or if we don't have a session)
      if (isFirstLoad) {
        const loginResponse = await api.login();
        if (!loginResponse.ok) {
          setError("Failed to authenticate with qBittorrent server");
          setLoading(false);
          hasLoadedOnce.current = true;
          return;
        }
      }

      // Get torrents
      const response = await api.getTorrents();

      if (response.error) {
        if (isFirstLoad) {
          setError(response.error);
        }
      } else if (response.ok) {
        // Only update if data actually changed (compare JSON strings)
        const newData = JSON.stringify(response.body);
        const oldData = JSON.stringify(torrents);
        if (newData !== oldData) {
          setTorrents(response.body);
        }
        // Clear any previous errors on success
        if (error) {
          setError(null);
        }
      } else {
        if (isFirstLoad) {
          setError(`Failed to load torrents: ${response.status}`);
        }
      }
    } catch (err) {
      if (isFirstLoad) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      if (isFirstLoad) {
        setLoading(false);
        hasLoadedOnce.current = true;
      }
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + "/s";
  };

  const formatEta = (seconds: number): string => {
    if (seconds === 8640000 || seconds < 0) return "∞";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStateColor = (state: string): string => {
    if (state.includes("downloading") || state.includes("DL")) return "text-primary";
    if (state.includes("uploading") || state.includes("UP")) return "text-chart-2";
    if (state.includes("paused")) return "text-muted-foreground";
    if (state.includes("error")) return "text-destructive";
    return "text-muted-foreground";
  };

  const getStateIcon = (state: string): string => {
    if (state.includes("downloading") || state.includes("DL")) return "fa-download";
    if (state.includes("uploading") || state.includes("UP")) return "fa-upload";
    if (state.includes("paused")) return "fa-pause";
    if (state.includes("error")) return "fa-exclamation-triangle";
    return "fa-question";
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const openServer = () => {
    if (settings?.serverUrl) {
      chrome.tabs.create({ url: settings.serverUrl });
    }
  };

  const handlePause = async (e: React.MouseEvent, hash: string) => {
    e.stopPropagation();
    if (!settings) return;

    const api = new QBittorrentAPI({
      serverUrl: settings.serverUrl,
      username: settings.username,
      password: settings.password,
    });

    await api.pauseTorrent(hash);
    loadTorrents();
  };

  const handleResume = async (e: React.MouseEvent, hash: string) => {
    e.stopPropagation();
    if (!settings) return;

    const api = new QBittorrentAPI({
      serverUrl: settings.serverUrl,
      username: settings.username,
      password: settings.password,
    });

    await api.resumeTorrent(hash);
    loadTorrents();
  };

  const handleDeleteClick = (e: React.MouseEvent, torrent: Torrent) => {
    e.stopPropagation();
    setDeleteConfirm({ hash: torrent.hash, name: torrent.name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !settings) return;

    const api = new QBittorrentAPI({
      serverUrl: settings.serverUrl,
      username: settings.username,
      password: settings.password,
    });

    await api.deleteTorrent(deleteConfirm.hash, deleteWithFiles);
    setDeleteConfirm(null);
    setDeleteWithFiles(false);
    loadTorrents();
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
    setDeleteWithFiles(false);
  };

  const filteredTorrents = useMemo(() => {
    switch (activeTab) {
      case "downloading":
        return torrents.filter((t) =>
          t.state.includes("downloading") ||
          t.state.includes("DL") ||
          t.state.includes("stalledDL") ||
          t.state.includes("metaDL")
        );
      case "seeding":
        return torrents.filter((t) =>
          t.state.includes("uploading") ||
          t.state.includes("UP") ||
          t.state.includes("stalledUP")
        );
      case "completed":
        return torrents.filter((t) => t.progress === 1);
      case "all":
      default:
        return torrents;
    }
  }, [torrents, activeTab]);

  const downloadingTorrents = useMemo(
    () => torrents.filter((t) => t.state.includes("downloading") || t.state.includes("DL")),
    [torrents]
  );

  // Update badge count whenever downloading torrents change
  useEffect(() => {
    chrome.runtime.sendMessage({
      type: "update-badge",
      count: downloadingTorrents.length,
    });
  }, [downloadingTorrents.length]);

  const tabs: { value: TabType; label: string; count: number }[] = [
    { value: "all", label: "All", count: torrents.length },
    {
      value: "downloading",
      label: "Downloading",
      count: torrents.filter((t) =>
        t.state.includes("downloading") ||
        t.state.includes("DL") ||
        t.state.includes("stalledDL") ||
        t.state.includes("metaDL")
      ).length,
    },
    {
      value: "seeding",
      label: "Seeding",
      count: torrents.filter((t) =>
        t.state.includes("uploading") ||
        t.state.includes("UP") ||
        t.state.includes("stalledUP")
      ).length,
    },
    {
      value: "completed",
      label: "Completed",
      count: torrents.filter((t) => t.progress === 1).length,
    },
  ];

  return (
    <div className="relative w-[460px] min-h-[300px] max-h-[600px] bg-background border border-border">
      <header className="border-b bg-card">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-card-foreground">qBits</h1>
            <span className="text-xs text-muted-foreground">
              {downloadingTorrents.length} active
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              onClick={openSettings}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-card-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex border-t border-border">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? "text-primary border-b-2 border-primary bg-accent/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      </header>

      <div className="overflow-y-auto max-h-[500px]">
        {loading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="p-4 m-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                <Button
                  onClick={openSettings}
                  variant="link"
                  className="h-auto p-0 text-xs mt-1"
                >
                  Open Settings
                </Button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && torrents.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-3" />
            <p className="text-sm">No torrents</p>
          </div>
        )}

        {!loading && !error && torrents.length > 0 && filteredTorrents.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-3" />
            <p className="text-sm">No torrents in this category</p>
          </div>
        )}

        {!loading && !error && filteredTorrents.length > 0 && (
          <div>
            {filteredTorrents.map((torrent) => (
              <div
                key={torrent.hash}
                className="p-4 hover:bg-accent/50 border-b last:border-b-0 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className="text-sm font-medium text-foreground truncate cursor-pointer flex-1"
                    title={torrent.name}
                    onClick={openServer}
                  >
                    {torrent.name}
                  </h3>
                  <div className="flex items-center gap-1 ml-2">
                    {torrent.state.includes("paused") ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-foreground"
                        onClick={(e) => handleResume(e, torrent.hash)}
                        title="Resume"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-foreground"
                        onClick={(e) => handlePause(e, torrent.hash)}
                        title="Pause"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => handleDeleteClick(e, torrent)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                  <span className="font-medium">{Math.round(torrent.progress * 100)}%</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {formatSpeed(torrent.dlspeed)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      {formatSpeed(torrent.upspeed)}
                    </span>
                    <span>{formatEta(torrent.eta)}</span>
                  </div>
                </div>

                <Progress value={torrent.progress * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-4 max-w-sm w-full shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground mb-1">Delete Torrent</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Are you sure you want to delete "{deleteConfirm.name}"?
                </p>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteWithFiles}
                    onChange={(e) => setDeleteWithFiles(e.target.checked)}
                    className="h-4 w-4 cursor-pointer"
                  />
                  Also delete files from disk
                </label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleDeleteCancel}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Popup;
