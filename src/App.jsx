import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    apiKey: ''
  });

  useEffect(() => {
    // Load settings from storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['settings'], (result) => {
        if (result.settings) {
          setSettings(result.settings);
        }
      });
    }
  }, []);

  const handleSave = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ settings }, () => {
        alert('Settings saved!');
      });
    } else {
      alert('Settings saved! (Mock)');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className={`container ${settings.darkMode ? 'dark' : ''}`}>
      <div className="settings-card">
        <header>
          <img src="icon.png" alt="Logo" className="logo" />
          <h1>Extension Settings</h1>
        </header>
        
        <div className="form-group">
          <label className="toggle-label">
            <span>Dark Mode</span>
            <input 
              type="checkbox" 
              name="darkMode" 
              checked={settings.darkMode} 
              onChange={handleChange} 
            />
          </label>
        </div>

        <div className="form-group">
          <label className="toggle-label">
            <span>Enable Notifications</span>
            <input 
              type="checkbox" 
              name="notifications" 
              checked={settings.notifications} 
              onChange={handleChange} 
            />
          </label>
        </div>

        <div className="form-group">
          <label>API Key</label>
          <input 
            type="text" 
            name="apiKey" 
            value={settings.apiKey} 
            onChange={handleChange} 
            placeholder="Enter your API key"
          />
        </div>

        <button className="save-btn" onClick={handleSave}>Save Settings</button>
      </div>
    </div>
  )
}

export default App
