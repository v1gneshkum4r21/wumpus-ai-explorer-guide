
import React from "react";
import { GameState } from "../types/game";
import { ArrowUp, Skull, CircleDotDashed, Coins } from "lucide-react";

interface GameGridProps {
  gameState: GameState;
}

const GameGrid: React.FC<GameGridProps> = ({ gameState }) => {
  const { grid, agentPosition, agentDirection } = gameState;

  return (
    <div className="relative border-2 border-wumpus-secondary rounded-lg p-2 overflow-hidden bg-wumpus-dark">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${gameState.gridSize}, 1fr)` }}>
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`cell ${cell.visited ? "cell-visited" : ""} ${
                x === agentPosition.x && y === agentPosition.y ? "cell-current" : ""
              }`}
              title={`Cell ${x},${y}`}
            >
              {/* Show cell content only if visited or debug mode */}
              {cell.visited && (
                <>
                  {cell.hasWumpus && <Skull className="wumpus-icon absolute top-1 left-1" size={16} />}
                  {cell.hasPit && <CircleDotDashed className="pit-icon absolute top-1 right-1" size={16} />}
                  {cell.hasGold && <Coins className="gold-icon animate-pulse-glow" size={24} />}
                </>
              )}

              {/* Show possible dangers (knowledge base) */}
              {!cell.visited && (
                <>
                  {cell.possibleWumpus && (
                    <span className="absolute top-1 right-1 text-xs text-wumpus-danger">W?</span>
                  )}
                  {cell.possiblePit && (
                    <span className="absolute bottom-1 right-1 text-xs text-muted-foreground">P?</span>
                  )}
                </>
              )}

              {/* Cell coordinates (small, for reference) */}
              <span className="absolute bottom-1 left-1 text-[10px] text-muted-foreground opacity-50">
                {x},{y}
              </span>

              {/* Agent */}
              {x === agentPosition.x && y === agentPosition.y && (
                <div className={`agent agent-${agentDirection}`}>
                  <ArrowUp className="text-wumpus-accent" size={24} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameGrid;
