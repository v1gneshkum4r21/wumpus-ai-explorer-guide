
import React from "react";
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Robot } from "lucide-react";

interface BotModeToggleProps {
  botMode: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

const BotModeToggle: React.FC<BotModeToggleProps> = ({ botMode, onToggle, disabled = false }) => {
  return (
    <div className="flex items-center space-x-2 bg-card rounded-lg p-3 shadow-md">
      <Robot className={`${botMode ? "text-wumpus-accent" : "text-muted-foreground"}`} size={18} />
      <Label htmlFor="bot-mode" className={disabled ? "text-muted-foreground" : ""}>Bot Mode</Label>
      <Switch 
        id="bot-mode" 
        checked={botMode} 
        onCheckedChange={onToggle} 
        disabled={disabled}
      />
    </div>
  );
};

export default BotModeToggle;
