
import React from "react";
import { Percept } from "../types/game";
import { Wind, Flame, Sparkles, Hammer, VolumeX } from "lucide-react";

interface PerceptDisplayProps {
  percepts: Percept;
}

const PerceptDisplay: React.FC<PerceptDisplayProps> = ({ percepts }) => {
  return (
    <div className="bg-card rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-3">Percepts</h3>
      <div className="flex flex-wrap justify-around gap-2">
        <div className={`percept-indicator ${percepts.breeze ? "percept-active bg-blue-900/50" : "bg-muted"}`} title="Breeze">
          <Wind size={18} className={`${percepts.breeze ? "text-blue-400" : "text-muted-foreground"}`} />
        </div>
        <div className={`percept-indicator ${percepts.stench ? "percept-active bg-red-900/50" : "bg-muted"}`} title="Stench">
          <Flame size={18} className={`${percepts.stench ? "text-red-400" : "text-muted-foreground"}`} />
        </div>
        <div className={`percept-indicator ${percepts.glitter ? "percept-active bg-yellow-900/50" : "bg-muted"}`} title="Glitter">
          <Sparkles size={18} className={`${percepts.glitter ? "text-yellow-400" : "text-muted-foreground"}`} />
        </div>
        <div className={`percept-indicator ${percepts.bump ? "percept-active bg-orange-900/50" : "bg-muted"}`} title="Bump">
          <Hammer size={18} className={`${percepts.bump ? "text-orange-400" : "text-muted-foreground"}`} />
        </div>
        <div className={`percept-indicator ${percepts.scream ? "percept-active bg-purple-900/50" : "bg-muted"}`} title="Scream">
          <VolumeX size={18} className={`${percepts.scream ? "text-purple-400" : "text-muted-foreground"}`} />
        </div>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">
        <div className="grid grid-cols-2 gap-1">
          <div className={`${percepts.breeze ? "text-blue-400" : ""}`}>Breeze: {percepts.breeze ? "Yes" : "No"}</div>
          <div className={`${percepts.stench ? "text-red-400" : ""}`}>Stench: {percepts.stench ? "Yes" : "No"}</div>
          <div className={`${percepts.glitter ? "text-yellow-400" : ""}`}>Glitter: {percepts.glitter ? "Yes" : "No"}</div>
          <div className={`${percepts.bump ? "text-orange-400" : ""}`}>Bump: {percepts.bump ? "Yes" : "No"}</div>
          <div className={`${percepts.scream ? "text-purple-400" : ""}`}>Scream: {percepts.scream ? "Yes" : "No"}</div>
        </div>
      </div>
    </div>
  );
};

export default PerceptDisplay;
