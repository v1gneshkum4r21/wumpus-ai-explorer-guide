
import { GameState, Action, Direction, Position } from "../types/game";
import { getSafetyScore, getMostPromisingCell } from "./knowledgeBase";
import { getNextPosition, isValidPosition } from "./gameLogic";

// Simple version of AI hint (real version would use Genkit)
export const getAiHint = (state: GameState): string => {
  const { percepts, agentPosition, agentDirection, grid, hasGold } = state;
  
  // If we have gold, suggest returning to start
  if (hasGold) {
    return "You have the gold! Try to find your way back to the starting point (0,0) to win the game.";
  }
  
  // If there's glitter, grab the gold
  if (percepts.glitter) {
    return "There's gold in this cell! Use the 'Grab' action to pick it up.";
  }
  
  // If there's a stench, warn about the wumpus
  if (percepts.stench) {
    return "I smell a stench! The Wumpus might be in an adjacent cell. Be careful!";
  }
  
  // If there's a breeze, warn about pits
  if (percepts.breeze) {
    return "I feel a breeze! There might be a pit in an adjacent cell. Proceed with caution!";
  }
  
  // Look for safe unvisited cells first
  const adjacentCells = [
    { direction: "north", pos: getNextPosition(agentPosition, "north") },
    { direction: "east", pos: getNextPosition(agentPosition, "east") },
    { direction: "south", pos: getNextPosition(agentPosition, "south") },
    { direction: "west", pos: getNextPosition(agentPosition, "west") }
  ];
  
  // Find the safest adjacent cell
  let bestDirection = null;
  let bestScore = -Infinity;
  
  adjacentCells.forEach(({ direction, pos }) => {
    if (isValidPosition(pos, state.gridSize)) {
      const cell = grid[pos.y][pos.x];
      const safetyScore = getSafetyScore(state, pos);
      
      if (safetyScore > bestScore && !cell.visited) {
        bestScore = safetyScore;
        bestDirection = direction;
      }
    }
  });
  
  if (bestDirection) {
    const actionsToReach = getActionsToFace(agentDirection, bestDirection as Direction);
    if (actionsToReach.length > 0) {
      return `I suggest exploring the ${bestDirection} cell. Try turning to face that direction first.`;
    } else {
      return `I suggest exploring the ${bestDirection} cell. You're already facing that way, so move forward!`;
    }
  }
  
  // If all adjacent cells are visited, suggest going to the most promising unvisited cell
  const mostPromisingCell = getMostPromisingCell(state);
  if (mostPromisingCell) {
    return `All adjacent cells have been explored. Try heading towards position (${mostPromisingCell.x}, ${mostPromisingCell.y}) to find new areas.`;
  }
  
  return "I'm not sure what to do next. Try exploring more of the cave!";
};

// Get the set of actions needed to face a direction
export const getActionsToFace = (current: Direction, target: Direction): Action[] => {
  if (current === target) {
    return [];
  }
  
  if ((current === "north" && target === "east") || 
      (current === "east" && target === "south") || 
      (current === "south" && target === "west") || 
      (current === "west" && target === "north")) {
    return ["turnRight"];
  }
  
  if ((current === "north" && target === "west") || 
      (current === "west" && target === "south") || 
      (current === "south" && target === "east") || 
      (current === "east" && target === "north")) {
    return ["turnLeft"];
  }
  
  // Need to turn twice (180 degrees)
  return ["turnRight", "turnRight"];
};

// Get the best action according to the AI
export const getBotAction = (state: GameState): Action => {
  const { percepts, agentPosition, agentDirection, grid, hasGold } = state;
  
  // If there's gold, grab it!
  if (percepts.glitter) {
    return "grab";
  }
  
  // If we have the gold and we're at (0,0), we've won already
  if (hasGold && agentPosition.x === 0 && agentPosition.y === 0) {
    return "restart"; // Game won
  }
  
  // If we have the gold, head back to (0,0)
  if (hasGold) {
    // Very simple algorithm: try to decrease X and Y to get back to (0,0)
    // This isn't optimal but works for demonstration purposes
    if (agentPosition.x > 0 && agentDirection === "west") {
      return "moveForward";
    } else if (agentPosition.y > 0 && agentDirection === "north") {
      return "moveForward";
    } else if (agentPosition.x > 0) {
      // Need to turn to face west
      if (agentDirection === "north") return "turnLeft";
      if (agentDirection === "south") return "turnRight";
      if (agentDirection === "east") return "turnLeft"; // Need to turn 180°, split into two steps
      return "moveForward"; // Should never get here
    } else if (agentPosition.y > 0) {
      // Need to turn to face north
      if (agentDirection === "east") return "turnLeft";
      if (agentDirection === "west") return "turnRight";
      if (agentDirection === "south") return "turnLeft"; // Need to turn 180°, split into two steps
      return "moveForward"; // Should never get here
    }
    return "moveForward"; // Should never get here
  }
  
  // Look for safe unvisited cells
  const adjacentCells = [
    { direction: "north", pos: getNextPosition(agentPosition, "north") },
    { direction: "east", pos: getNextPosition(agentPosition, "east") },
    { direction: "south", pos: getNextPosition(agentPosition, "south") },
    { direction: "west", pos: getNextPosition(agentPosition, "west") }
  ];
  
  // Find the safest adjacent cell
  let bestDirection = null;
  let bestScore = -Infinity;
  
  adjacentCells.forEach(({ direction, pos }) => {
    if (isValidPosition(pos, state.gridSize)) {
      const cell = grid[pos.y][pos.x];
      const safetyScore = getSafetyScore(state, pos);
      
      // Favor unvisited cells that are safe
      if (safetyScore > bestScore && (!cell.visited || hasGold)) {
        bestScore = safetyScore;
        bestDirection = direction;
      }
    }
  });
  
  if (bestDirection) {
    const actionsToReach = getActionsToFace(agentDirection, bestDirection as Direction);
    if (actionsToReach.length > 0) {
      return actionsToReach[0]; // Take first step in turning
    } else {
      return "moveForward"; // Already facing the right way
    }
  }
  
  // If we're stuck, just turn and try a different direction
  return Math.random() < 0.5 ? "turnLeft" : "turnRight";
};
