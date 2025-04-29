
import React from "react";
import { Lightbulb } from "lucide-react";

interface AIHintProps {
  hint: string;
  isLoading?: boolean;
  isGoogleAI?: boolean;
}

const AIHint: React.FC<AIHintProps> = ({ hint, isLoading = false, isGoogleAI = false }) => {
  return (
    <div className="hint-box bg-card rounded-lg p-4 shadow-md">
      <div className="flex items-center mb-2">
        <Lightbulb className="text-wumpus-accent mr-2" size={18} />
        <h3 className="text-lg font-semibold">
          {isGoogleAI ? "Google AI Hint" : "AI Hint"}
        </h3>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-wumpus-accent border-t-transparent rounded-full animate-spin-slow"></div>
          <span className="ml-2 text-sm text-muted-foreground">Thinking...</span>
        </div>
      ) : (
        <p className="text-sm">{hint}</p>
      )}
    </div>
  );
};

export default AIHint;
