import { GameState, Position, Direction, Action, Cell, Percept } from "../types/game";
import { updateKnowledge } from "./knowledgeBase";

// Constants
export const GRID_SIZE = 4;
export const WUMPUS_PENALTY = -1000;
export const PIT_PENALTY = -1000;
export const GOLD_REWARD = 1000;
export const ARROW_PENALTY = -10;
export const MOVE_PENALTY = -1;

// Create a new game state
export const createNewGame = (): GameState => {
  // Initialize an empty grid
  const grid: Cell[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() =>
      Array(GRID_SIZE)
        .fill(null)
        .map(() => ({
          hasWumpus: false,
          hasPit: false,
          hasGold: false,
          visited: false,
          safe: null,
          possibleWumpus: false,
          possiblePit: false,
        }))
    );

  // Mark the starting position as visited and safe
  grid[0][0].visited = true;
  grid[0][0].safe = true;

  // Randomly place Wumpus (not in [0,0])
  let wumpusX = 0;
  let wumpusY = 0;
  while (wumpusX === 0 && wumpusY === 0) {
    wumpusX = Math.floor(Math.random() * GRID_SIZE);
    wumpusY = Math.floor(Math.random() * GRID_SIZE);
  }
  grid[wumpusY][wumpusX].hasWumpus = true;

  // Randomly place Gold (not in [0,0])
  let goldX = 0;
  let goldY = 0;
  while ((goldX === 0 && goldY === 0) || (goldX === wumpusX && goldY === wumpusY)) {
    goldX = Math.floor(Math.random() * GRID_SIZE);
    goldY = Math.floor(Math.random() * GRID_SIZE);
  }
  grid[goldY][goldX].hasGold = true;

  // Randomly place Pits (not in [0,0]) with probability 0.2
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if ((x === 0 && y === 0) || (x === wumpusX && y === wumpusY) || (x === goldX && y === goldY)) {
        continue;
      }
      if (Math.random() < 0.2) {
        grid[y][x].hasPit = true;
      }
    }
  }

  // Initial game state
  const initialState: GameState = {
    gridSize: GRID_SIZE,
    agentPosition: { x: 0, y: 0 },
    agentDirection: "east",
    grid,
    percepts: { stench: false, breeze: false, glitter: false, bump: false, scream: false },
    hasArrow: true,
    hasGold: false,
    gameOver: false,
    gameWon: false,
    score: 0,
    moves: 0,
  };

  return calculatePercepts(initialState);
};

// Check if a position is valid (within grid boundaries)
export const isValidPosition = (pos: Position, gridSize: number): boolean => {
  return pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize;
};

// Get the next position when moving in a direction
export const getNextPosition = (pos: Position, direction: Direction): Position => {
  switch (direction) {
    case "north":
      return { x: pos.x, y: pos.y - 1 };
    case "east":
      return { x: pos.x + 1, y: pos.y };
    case "south":
      return { x: pos.x, y: pos.y + 1 };
    case "west":
      return { x: pos.x - 1, y: pos.y };
  }
};

// Turn the agent left
export const turnLeft = (direction: Direction): Direction => {
  switch (direction) {
    case "north":
      return "west";
    case "east":
      return "north";
    case "south":
      return "east";
    case "west":
      return "south";
  }
};

// Turn the agent right
export const turnRight = (direction: Direction): Direction => {
  switch (direction) {
    case "north":
      return "east";
    case "east":
      return "south";
    case "south":
      return "west";
    case "west":
      return "north";
  }
};

// Calculate percepts for the current position
export const calculatePercepts = (state: GameState): GameState => {
  const { agentPosition, grid, gridSize } = state;
  const { x, y } = agentPosition;

  // Initialize percepts
  const percepts: Percept = {
    stench: false,
    breeze: false,
    glitter: false,
    bump: false,
    scream: false,
  };

  // Check for glitter in the current cell
  if (grid[y][x].hasGold) {
    percepts.glitter = true;
  }

  // Check adjacent cells for wumpus (stench) and pits (breeze)
  const adjacentCells = [
    { x: x, y: y - 1 }, // North
    { x: x + 1, y: y }, // East
    { x: x, y: y + 1 }, // South
    { x: x - 1, y: y }, // West
  ];

  adjacentCells.forEach((pos) => {
    if (isValidPosition(pos, gridSize)) {
      if (grid[pos.y][pos.x].hasWumpus) {
        percepts.stench = true;
      }
      if (grid[pos.y][pos.x].hasPit) {
        percepts.breeze = true;
      }
    }
  });

  // The bump and scream percepts are set elsewhere during move/shoot actions

  return {
    ...state,
    percepts,
  };
};

// Perform an action and update the game state
export const performAction = (state: GameState, action: Action): GameState => {
  let newState = { ...state, percepts: { ...state.percepts, bump: false, scream: false } };

  switch (action) {
    case "moveForward": {
      const nextPos = getNextPosition(state.agentPosition, state.agentDirection);
      
      // Check if the next position is valid
      if (!isValidPosition(nextPos, state.gridSize)) {
        newState.percepts.bump = true;
        return newState;
      }

      // Update agent position
      newState = {
        ...newState,
        agentPosition: nextPos,
        moves: state.moves + 1,
        score: state.score + MOVE_PENALTY,
      };

      // Mark the new cell as visited
      newState.grid = [...newState.grid];
      newState.grid[nextPos.y] = [...newState.grid[nextPos.y]];
      newState.grid[nextPos.y][nextPos.x] = {
        ...newState.grid[nextPos.y][nextPos.x],
        visited: true,
      };

      // Check for death conditions
      const currentCell = newState.grid[nextPos.y][nextPos.x];
      if (currentCell.hasWumpus || currentCell.hasPit) {
        newState.gameOver = true;
        newState.score += currentCell.hasWumpus ? WUMPUS_PENALTY : PIT_PENALTY;
      }

      // Update percepts for the new position
      newState = calculatePercepts(newState);
      
      // Update the knowledge base
      newState = updateKnowledge(newState);
      
      return newState;
    }

    case "turnLeft": {
      return {
        ...newState,
        agentDirection: turnLeft(state.agentDirection),
        moves: state.moves + 1,
        score: state.score + MOVE_PENALTY,
      };
    }

    case "turnRight": {
      return {
        ...newState,
        agentDirection: turnRight(state.agentDirection),
        moves: state.moves + 1,
        score: state.score + MOVE_PENALTY,
      };
    }

    case "grab": {
      const { x, y } = state.agentPosition;
      if (state.grid[y][x].hasGold) {
        // Create a new grid with the gold removed from the current position
        const newGrid = [...state.grid];
        newGrid[y] = [...newGrid[y]];
        newGrid[y][x] = {
          ...newGrid[y][x],
          hasGold: false,
        };

        return {
          ...newState,
          grid: newGrid,
          hasGold: true,
          percepts: {
            ...newState.percepts,
            glitter: false,
          },
          score: state.score + GOLD_REWARD,
          gameWon: true, // Auto-win when gold is grabbed for simplicity
        };
      }
      return newState;
    }

    case "shoot": {
      if (!state.hasArrow) {
        return newState;
      }

      // Shoot the arrow in the direction the agent is facing
      const direction = state.agentDirection;
      let arrowPos = { ...state.agentPosition };
      let hitWumpus = false;

      // Keep moving the arrow until it hits something or goes out of bounds
      while (isValidPosition(arrowPos, state.gridSize)) {
        arrowPos = getNextPosition(arrowPos, direction);
        
        if (!isValidPosition(arrowPos, state.gridSize)) {
          break;
        }

        if (state.grid[arrowPos.y][arrowPos.x].hasWumpus) {
          hitWumpus = true;
          break;
        }
      }

      // Create a new grid with the wumpus removed if hit
      let newGrid = [...state.grid];
      if (hitWumpus) {
        newGrid = newGrid.map((row, y) =>
          row.map((cell, x) => {
            if (x === arrowPos.x && y === arrowPos.y && cell.hasWumpus) {
              return { ...cell, hasWumpus: false };
            }
            return cell;
          })
        );
      }

      return {
        ...newState,
        grid: newGrid,
        hasArrow: false,
        percepts: {
          ...newState.percepts,
          scream: hitWumpus,
        },
        score: state.score + ARROW_PENALTY,
      };
    }

    case "restart": {
      return createNewGame();
    }

    default:
      return state;
  }
};
