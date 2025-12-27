import { useState, useEffect } from "react";
import { QBittorrentAPI } from "../../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Plug, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface Settings {
  serverUrl: string;
  username: string;
  password: string;
  notifications: boolean;
}

interface Alert {
  type: "success" | "error" | "info";
  message: string;
}

const defaultSettings: Settings = {
  serverUrl: "",
  username: "",
  password: "",
  notifications: true,
};

function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [version, setVersion] = useState<string>("");
  const [alert, setAlert] = useState<Alert | null>(null);

  useEffect(() => {
    // Load settings from storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(["settings"], (result) => {
        if (result.settings) {
          setSettings(result.settings as Settings);
        }
      });
    }

    // Get version from manifest
    if (typeof chrome !== "undefined" && chrome.runtime) {
      const manifest = chrome.runtime.getManifest();
      setVersion(manifest.version);
    }
  }, []);

  const showAlert = (type: Alert["type"], message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!settings.serverUrl || !settings.username || !settings.password) {
      showAlert("error", "Please fill in all connection details");
      return;
    }

    setIsSaving(true);

    try {
      // Test connection first
      const api = new QBittorrentAPI({
        serverUrl: settings.serverUrl,
        username: settings.username,
        password: settings.password,
      });

      const response = await api.login();

      if (response.error) {
        showAlert("error", `Connection failed: ${response.error}`);
        return;
      }
      
      if (!response.ok) {
        showAlert("error", `Connection failed: ${response.status} - ${response.body}`);
        return;
      }

      // Connection successful, save settings
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.sync.set({ settings }, () => {
          showAlert("success", "Connection verified and settings saved!");
        });
      } else {
        showAlert("info", "Connection verified! Settings saved (Mock mode)");
      }
    } catch (error) {
      console.error("Connection error:", error);
      showAlert(
        "error",
        `Connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>qBits Settings</CardTitle>
              <CardDescription>Configure your qBittorrent connection</CardDescription>
            </div>
            <ThemeToggle />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serverUrl">Server URL</Label>
            <Input
              id="serverUrl"
              name="serverUrl"
              type="text"
              value={settings.serverUrl}
              onChange={handleChange}
              placeholder="http://localhost:8080"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={settings.username}
              onChange={handleChange}
              placeholder="admin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={settings.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="notifications" className="cursor-pointer">
              Enable Notifications
            </Label>
            <input
              id="notifications"
              name="notifications"
              type="checkbox"
              checked={settings.notifications}
              onChange={handleChange}
              className="h-4 w-4 cursor-pointer"
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} className="w-full" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Plug className="mr-2 h-4 w-4 animate-pulse" />
                  Testing connection...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>

          {alert && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-center gap-3 text-sm ${
                alert.type === "success"
                  ? "bg-success/10 text-success border border-success/20"
                  : alert.type === "error"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-accent text-accent-foreground border border-border"
              }`}
            >
              <span className="flex-1">{alert.message}</span>
              <button
                onClick={() => setAlert(null)}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {version && (
            <div className="pt-4 text-center text-xs text-muted-foreground">
              v{version}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
