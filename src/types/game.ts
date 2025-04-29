
export type Direction = 'north' | 'east' | 'south' | 'west';

export type Position = {
  x: number;
  y: number;
};

export type Cell = {
  hasWumpus: boolean;
  hasPit: boolean;
  hasGold: boolean;
  visited: boolean;
  safe: boolean | null;
  possibleWumpus: boolean;
  possiblePit: boolean;
};

export type Percept = {
  stench: boolean;
  breeze: boolean;
  glitter: boolean;
  bump: boolean;
  scream: boolean;
};

export type GameState = {
  gridSize: number;
  agentPosition: Position;
  agentDirection: Direction;
  grid: Cell[][];
  percepts: Percept;
  hasArrow: boolean;
  hasGold: boolean;
  gameOver: boolean;
  gameWon: boolean;
  score: number;
  moves: number;
};

export type Action = 'moveForward' | 'turnLeft' | 'turnRight' | 'grab' | 'shoot' | 'restart';
