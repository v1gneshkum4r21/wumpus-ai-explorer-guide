
import React from "react";
import { Action } from "../types/game";
import { ArrowUp, RotateCcw, RotateCw, Grab, Target, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onAction: (action: Action) => void;
  hasArrow: boolean;
  hasGold: boolean;
  gameOver: boolean;
  gameWon: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onAction, 
  hasArrow, 
  hasGold, 
  gameOver, 
  gameWon 
}) => {
  return (
    <div className="bg-card rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-3">Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          onClick={() => onAction("moveForward")}
          disabled={gameOver || gameWon}
          className="action-button"
        >
          <ArrowUp className="mr-2" size={18} />
          Forward
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => onAction("turnLeft")}
          disabled={gameOver || gameWon}
          className="action-button"
        >
          <RotateCcw className="mr-2" size={18} />
          Turn Left
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => onAction("turnRight")}
          disabled={gameOver || gameWon}
          className="action-button"
        >
          <RotateCw className="mr-2" size={18} />
          Turn Right
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => onAction("grab")}
          disabled={gameOver || gameWon || hasGold}
          className="action-button"
        >
          <Grab className="mr-2" size={18} />
          Grab
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => onAction("shoot")}
          disabled={gameOver || gameWon || !hasArrow}
          className="action-button"
        >
          <Target className="mr-2" size={18} />
          Shoot
        </Button>
        
        <Button 
          variant={gameOver || gameWon ? "default" : "destructive"}
          onClick={() => onAction("restart")}
          className="action-button col-span-2"
        >
          <RefreshCw className="mr-2" size={18} />
          {gameOver || gameWon ? "New Game" : "Restart"}
        </Button>
      </div>

      <div className="mt-4 text-sm">
        {hasArrow ? (
          <div className="text-green-400">Arrow: Available</div>
        ) : (
          <div className="text-muted-foreground">Arrow: Used</div>
        )}
        
        {hasGold ? (
          <div className="text-yellow-400">Gold: Collected!</div>
        ) : (
          <div className="text-muted-foreground">Gold: Not found</div>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
