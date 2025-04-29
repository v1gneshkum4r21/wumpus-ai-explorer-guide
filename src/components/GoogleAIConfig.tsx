
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initGoogleAI, isGoogleAIConfigured } from "@/utils/googleAI";

interface GoogleAIConfigProps {
  onConfigured: (configured: boolean) => void;
}

const GoogleAIConfig: React.FC<GoogleAIConfigProps> = ({ onConfigured }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("gemini-pro");
  const [isConfigured, setIsConfigured] = useState<boolean>(isGoogleAIConfigured());
  const [error, setError] = useState<string>("");

  const saveConfig = useCallback(() => {
    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }

    try {
      initGoogleAI(apiKey.trim(), model.trim() || "gemini-pro");
      setIsConfigured(true);
      setError("");
      onConfigured(true);
      
      // Save API key to localStorage (Note: in a production app, consider more secure storage)
      localStorage.setItem("googleAIApiKey", apiKey.trim());
      localStorage.setItem("googleAIModel", model.trim() || "gemini-pro");
    } catch (err) {
      console.error("Error configuring Google AI:", err);
      setError("Failed to configure Google AI");
      onConfigured(false);
    }
  }, [apiKey, model, onConfigured]);

  // Load saved API key on component mount
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem("googleAIApiKey");
    const savedModel = localStorage.getItem("googleAIModel");
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setModel(savedModel || "gemini-pro");
      initGoogleAI(savedApiKey, savedModel || "gemini-pro");
      setIsConfigured(true);
      onConfigured(true);
    }
  }, [onConfigured]);

  return (
    <div className="bg-card rounded-lg p-4 shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-3">Google AI Configuration</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">Google AI API Key</Label>
          <Input 
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Google AI API key"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="model">Model (optional)</Label>
          <Input 
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gemini-pro"
          />
          <p className="text-xs text-muted-foreground">Default: gemini-pro</p>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <Button onClick={saveConfig} className="w-full">
          {isConfigured ? "Update Configuration" : "Save Configuration"}
        </Button>
        
        {isConfigured && (
          <p className="text-green-500 text-sm text-center">
            Google AI configured successfully!
          </p>
        )}
      </div>
    </div>
  );
};

export default GoogleAIConfig;
