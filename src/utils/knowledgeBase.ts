
import { GameState, Position } from "../types/game";
import { isValidPosition, getNextPosition } from "./gameLogic";

// Update the knowledge base based on current percepts
export const updateKnowledge = (state: GameState): GameState => {
  const { agentPosition, percepts, grid, gridSize } = state;
  const { x, y } = agentPosition;
  
  // Create a new grid to avoid mutating the original
  const newGrid = [...grid];
  
  // Mark the current cell as safe
  newGrid[y] = [...newGrid[y]];
  newGrid[y][x] = {
    ...newGrid[y][x],
    safe: true,
    possibleWumpus: false,
    possiblePit: false,
  };
  
  // Get adjacent cells
  const adjacentCells = [
    { x: x, y: y - 1, direction: "north" }, // North
    { x: x + 1, y: y, direction: "east" },  // East
    { x: x, y: y + 1, direction: "south" }, // South
    { x: x - 1, y: y, direction: "west" },  // West
  ];
  
  // If no stench or breeze, all adjacent cells are safe
  if (!percepts.stench && !percepts.breeze) {
    adjacentCells.forEach((pos) => {
      if (isValidPosition(pos, gridSize)) {
        newGrid[pos.y] = [...newGrid[pos.y]];
        newGrid[pos.y][pos.x] = {
          ...newGrid[pos.y][pos.x],
          safe: true,
          possibleWumpus: false,
          possiblePit: false,
        };
      }
    });
  } 
  else {
    // If there's a stench or breeze, adjacent cells might have wumpus or pit
    adjacentCells.forEach((pos) => {
      if (isValidPosition(pos, gridSize) && newGrid[pos.y][pos.x].safe !== true) {
        newGrid[pos.y] = [...newGrid[pos.y]];
        newGrid[pos.y][pos.x] = {
          ...newGrid[pos.y][pos.x],
          possibleWumpus: percepts.stench || newGrid[pos.y][pos.x].possibleWumpus,
          possiblePit: percepts.breeze || newGrid[pos.y][pos.x].possiblePit,
        };
      }
    });
  }

  // If no scream heard and no stench, update possible wumpus locations
  if (percepts.scream) {
    // Wumpus is dead, clear all possible wumpus markers
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (newGrid[y][x].possibleWumpus) {
          newGrid[y] = [...newGrid[y]];
          newGrid[y][x] = {
            ...newGrid[y][x],
            possibleWumpus: false,
          };
        }
      }
    }
  }
  
  return {
    ...state,
    grid: newGrid,
  };
};

// Get the safety score for a position (higher is safer)
export const getSafetyScore = (state: GameState, pos: Position): number => {
  const { grid, gridSize } = state;
  
  // Out of bounds is very unsafe
  if (!isValidPosition(pos, gridSize)) {
    return -100;
  }
  
  const cell = grid[pos.y][pos.x];
  
  // Already visited cells are completely safe
  if (cell.visited) {
    return 10;
  }
  
  // Known safe cells are good
  if (cell.safe === true) {
    return 8;
  }
  
  // Cells with possible dangers are risky
  if (cell.possibleWumpus && cell.possiblePit) {
    return -5; // Both dangers are very risky
  }
  
  if (cell.possibleWumpus) {
    return -3;
  }
  
  if (cell.possiblePit) {
    return -3;
  }
  
  // Unknown cells are neutral
  return 0;
};

// Get the most promising unvisited cell
export const getMostPromisingCell = (state: GameState): Position | null => {
  const { grid, gridSize } = state;
  let bestPos: Position | null = null;
  let bestScore = -Infinity;
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const pos = { x, y };
      const cell = grid[y][x];
      
      // Skip visited cells
      if (cell.visited) {
        continue;
      }
      
      const safetyScore = getSafetyScore(state, pos);
      
      if (safetyScore > bestScore) {
        bestScore = safetyScore;
        bestPos = pos;
      }
    }
  }
  
  return bestPos;
};
