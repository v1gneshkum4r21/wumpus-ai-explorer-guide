import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Position, GameState, Direction } from '../types/game';
import { getNextPosition, isValidPosition } from '../utils/gameLogic';
import { Home, AlertTriangle, Skull, Play, RotateCcw, Info, ArrowRight, Lightbulb, MapPin } from 'lucide-react';

interface AlgorithmsPageProps {
  gameState?: GameState;
}

// Node for pathfinding algorithms
interface Node {
  position: Position;
  parent: Node | null;
  g: number; // Cost from start node
  h: number; // Heuristic (estimated cost to goal)
  f: number; // Total cost (g + h)
}

const AlgorithmsPage: React.FC<AlgorithmsPageProps> = ({ gameState }) => {
  const [algorithm, setAlgorithm] = useState<'astar' | 'dfs'>('astar');
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [goalPos, setGoalPos] = useState<Position>({ x: 3, y: 3 });
  const [path, setPath] = useState<Position[]>([]);
  const [visited, setVisited] = useState<Position[]>([]);
  const [gridSize, setGridSize] = useState<number>(4);
  const [obstacles, setObstacles] = useState<{[key: string]: {isPit?: boolean, isWumpus?: boolean}}>({});
  const [selectionMode, setSelectionMode] = useState<'start' | 'goal' | 'obstacle'>('start');
  
  // Effect to load obstacles from game state if available
  useEffect(() => {
    if (gameState) {
      const newObstacles: {[key: string]: {isPit?: boolean, isWumpus?: boolean}} = {};
      
      for (let y = 0; y < gameState.grid.length; y++) {
        for (let x = 0; x < gameState.grid[y].length; x++) {
          const cell = gameState.grid[y][x];
          if (cell.hasPit || cell.hasWumpus) {
            const key = `${x},${y}`;
            newObstacles[key] = {
              isPit: cell.hasPit,
              isWumpus: cell.hasWumpus
            };
          }
        }
      }
      
      setObstacles(newObstacles);
      setGridSize(gameState.grid.length);
    }
  }, [gameState]);

  // Manhattan distance heuristic for A*
  const manhattanDistance = (pos1: Position, pos2: Position): number => {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  };

  // Check if two positions are equal
  const positionsEqual = (pos1: Position, pos2: Position): boolean => {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  };

  // Check if a position exists in a list
  const positionInList = (pos: Position, list: Position[]): boolean => {
    return list.some(p => positionsEqual(p, pos));
  };

  // Get neighbors of a position
  const getNeighbors = (pos: Position): Position[] => {
    const directions: Direction[] = ['north', 'east', 'south', 'west'];
    const neighbors: Position[] = [];
  
    for (const dir of directions) {
      const nextPos = getNextPosition(pos, dir);
      if (isValidPosition(nextPos, gridSize)) {
        // Check if the position is an obstacle
        const posKey = `${nextPos.x},${nextPos.y}`;
        const isObstacle = obstacles[posKey];
        
        if (!isObstacle) {
          neighbors.push(nextPos);
        }
      }
    }
  
    return neighbors;
  };

  // A* Search Algorithm
  const aStarSearch = (start: Position, goal: Position): Position[] => {
    const openSet: Node[] = [];
    const closedSet: Position[] = [];
    
    // Create start node
    const startNode: Node = {
      position: start,
      parent: null,
      g: 0,
      h: manhattanDistance(start, goal),
      f: manhattanDistance(start, goal)
    };
    
    openSet.push(startNode);
    
    while (openSet.length > 0) {
      // Find node with lowest f score
      let currentIndex = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }
      
      const current = openSet[currentIndex];
      
      // If we reached the goal
      if (positionsEqual(current.position, goal)) {
        const path: Position[] = [];
        let currentNode: Node | null = current;
        
        while (currentNode) {
          path.unshift(currentNode.position);
          currentNode = currentNode.parent;
        }
        
        setVisited([...closedSet]);
        return path;
      }
      
      // Move current from open to closed set
      openSet.splice(currentIndex, 1);
      closedSet.push(current.position);
      
      // Check all neighbors
      const neighbors = getNeighbors(current.position);
      
      for (const neighbor of neighbors) {
        // Skip if neighbor is in closed set
        if (positionInList(neighbor, closedSet)) {
          continue;
        }
        
        // Calculate g score for this neighbor
        const gScore = current.g + 1; // Assuming cost of 1 to move to any neighbor
        
        // Check if neighbor is in open set
        const existingNeighborIndex = openSet.findIndex(node => 
          positionsEqual(node.position, neighbor)
        );
        
        if (existingNeighborIndex === -1) {
          // Neighbor not in open set, add it
          const hScore = manhattanDistance(neighbor, goal);
          openSet.push({
            position: neighbor,
            parent: current,
            g: gScore,
            h: hScore,
            f: gScore + hScore
          });
        } else if (gScore < openSet[existingNeighborIndex].g) {
          // Found a better path to this neighbor
          openSet[existingNeighborIndex].g = gScore;
          openSet[existingNeighborIndex].f = gScore + openSet[existingNeighborIndex].h;
          openSet[existingNeighborIndex].parent = current;
        }
      }
    }
    
    // No path found
    setVisited([...closedSet]);
    return [];
  };

  // DFS Algorithm
  const dfsSearch = (start: Position, goal: Position): Position[] => {
    const visited: Position[] = [];
    const stack: Node[] = [];
    const pathMap = new Map<string, Node>();
    
    // Create start node
    const startNode: Node = {
      position: start,
      parent: null,
      g: 0,
      h: 0,
      f: 0
    };
    
    stack.push(startNode);
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      const posKey = `${current.position.x},${current.position.y}`;
      
      // Skip if already visited
      if (positionInList(current.position, visited)) {
        continue;
      }
      
      // Mark as visited
      visited.push(current.position);
      pathMap.set(posKey, current);
      
      // If we reached the goal
      if (positionsEqual(current.position, goal)) {
        const path: Position[] = [];
        let currentNode: Node | null = current;
        
        while (currentNode) {
          path.unshift(currentNode.position);
          currentNode = currentNode.parent;
        }
        
        setVisited([...visited]);
        return path;
      }
      
      // Get neighbors and add to stack (in reverse order to prioritize north, east, south, west)
      const neighbors = getNeighbors(current.position).reverse();
      
      for (const neighbor of neighbors) {
        if (!positionInList(neighbor, visited)) {
          stack.push({
            position: neighbor,
            parent: current,
            g: 0,
            h: 0,
            f: 0
          });
        }
      }
    }
    
    // No path found
    setVisited([...visited]);
    return [];
  };

  // Run the selected algorithm
  const runAlgorithm = () => {
    if (algorithm === 'astar') {
      const result = aStarSearch(startPos, goalPos);
      setPath(result);
    } else {
      const result = dfsSearch(startPos, goalPos);
      setPath(result);
    }
  };

  // Add an obstacle (for manual testing)
  const toggleObstacle = (pos: Position) => {
    const posKey = `${pos.x},${pos.y}`;
    
    // Don't allow obstacles on start or goal
    if (positionsEqual(pos, startPos) || positionsEqual(pos, goalPos)) {
      return;
    }
    
    setObstacles(prev => {
      const newObstacles = {...prev};
      
      if (newObstacles[posKey]) {
        // Toggle between pit and wumpus, then remove
        if (newObstacles[posKey].isPit) {
          newObstacles[posKey] = { isWumpus: true };
        } else {
          delete newObstacles[posKey];
        }
      } else {
        // Add new pit
        newObstacles[posKey] = { isPit: true };
      }
      
      return newObstacles;
    });
    
    // Clear path when obstacles change
    setPath([]);
  };

  // Render the grid
  const renderGrid = () => {
    const grid = [];
    
    for (let y = 0; y < gridSize; y++) {
      const row = [];
      for (let x = 0; x < gridSize; x++) {
        const pos = { x, y };
        const posKey = `${x},${y}`;
        const isStart = positionsEqual(pos, startPos);
        const isGoal = positionsEqual(pos, goalPos);
        const isPath = positionInList(pos, path);
        const isVisited = positionInList(pos, visited) && !isPath;
        const obstacle = obstacles[posKey];
        
        // Calculate cell size based on grid size
        const cellSize = Math.max(14 - gridSize, 8); // Adjust cell size based on grid size
        
        let cellClass = `w-${cellSize} h-${cellSize} border border-gray-600 flex items-center justify-center relative transition-all duration-200`;
        let cellContent = '';
        
        if (isStart) {
          cellClass += " bg-blue-600 text-white font-bold";
          cellContent = 'S';
        } else if (isGoal) {
          cellClass += " bg-green-600 text-white font-bold";
          cellContent = 'G';
        } else if (obstacle?.isPit) {
          cellClass += " bg-gray-900 text-white";
          cellContent = 'P';
        } else if (obstacle?.isWumpus) {
          cellClass += " bg-red-700 text-white";
          cellContent = 'W';
        } else if (isPath) {
          cellClass += " bg-yellow-600 text-white";
          cellContent = '•';
        } else if (isVisited) {
          cellClass += " bg-blue-900 text-blue-200";
        } else {
          // Add highlight for cells based on current selection mode
          cellClass += " bg-gray-700 text-gray-300";
          if (selectionMode === 'start') {
            cellClass += " hover:bg-blue-800 cursor-pointer";
          } else if (selectionMode === 'goal') {
            cellClass += " hover:bg-green-800 cursor-pointer";
          } else {
            cellClass += " hover:bg-gray-600 cursor-pointer";
          }
        }
        
        row.push(
          <div 
            key={`${x}-${y}`} 
            className={cellClass}
            onClick={() => {
              // Handle cell click based on selection mode
              if (selectionMode === 'start' && !positionsEqual(pos, goalPos)) {
                setStartPos(pos);
                // Automatically switch to goal selection after setting start
                setSelectionMode('goal');
                // Clear path when changing positions
                setPath([]);
              } else if (selectionMode === 'goal' && !positionsEqual(pos, startPos)) {
                setGoalPos(pos);
                // Automatically switch to obstacle mode after setting goal
                setSelectionMode('obstacle');
                // Clear path when changing positions
                setPath([]);
              } else if (selectionMode === 'obstacle') {
                // Don't allow obstacles on start or goal
                if (!positionsEqual(pos, startPos) && !positionsEqual(pos, goalPos)) {
                  toggleObstacle(pos);
                }
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              // Right-click always toggles obstacles regardless of mode
              if (!positionsEqual(pos, startPos) && !positionsEqual(pos, goalPos)) {
                toggleObstacle(pos);
              }
            }}
          >
            <span className={`${isPath || isStart || isGoal ? 'text-lg' : ''}`}>{cellContent}</span>
            <span className="absolute bottom-0 right-0 text-[8px] text-gray-400 opacity-50">{x},{y}</span>
          </div>
        );
      }
      grid.push(
        <div key={y} className="flex">
          {row}
        </div>
      );
    }
    
    return (
      <div className="p-1 bg-gray-800 rounded-lg">
        {grid}
      </div>
    );
  };

  // Add this to the JSX in the grid section, before the grid itself
  <div className="mb-4 flex flex-wrap gap-2">
    <button
      className={`px-3 py-2 rounded-lg flex items-center text-sm ${
        selectionMode === 'start' 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      onClick={() => setSelectionMode('start')}
    >
      <span className="font-medium">Set Start Position</span>
    </button>
    
    <button
      className={`px-3 py-2 rounded-lg flex items-center text-sm ${
        selectionMode === 'goal' 
          ? 'bg-green-500 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      onClick={() => setSelectionMode('goal')}
    >
      <span className="font-medium">Set Goal Position</span>
    </button>
    
    <button
      className={`px-3 py-2 rounded-lg flex items-center text-sm ${
        selectionMode === 'obstacle' 
          ? 'bg-gray-700 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      onClick={() => setSelectionMode('obstacle')}
    >
      <span className="font-medium">Add Obstacles</span>
    </button>
  </div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6 text-white">
      <div className="container mx-auto">
        <header className="flex items-center justify-between mb-6 bg-gray-800 rounded-lg p-4 shadow-md border border-gray-700">
          <div className="flex items-center">
            <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4 transition-colors">
              <Home className="mr-2" size={20} />
              <span>Back to Game</span>
            </Link>
            <h1 className="text-3xl font-bold text-purple-400">Pathfinding Algorithms</h1>
          </div>
        </header>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-purple-300">
                <Play size={20} className="mr-2 text-green-400" />
                Algorithm Selection
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
                    algorithm === 'astar' 
                      ? 'bg-blue-700 text-white shadow-lg transform scale-105 border border-blue-500' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                  }`}
                  onClick={() => setAlgorithm('astar')}
                >
                  <span className="text-lg font-medium">A*</span>
                  <span className="text-xs mt-1">Informed Search</span>
                </button>
                
                <button
                  className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
                    algorithm === 'dfs' 
                      ? 'bg-purple-700 text-white shadow-lg transform scale-105 border border-purple-500' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                  }`}
                  onClick={() => setAlgorithm('dfs')}
                >
                  <span className="text-lg font-medium">DFS</span>
                  <span className="text-xs mt-1">Depth-First</span>
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-300">Grid Size:</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={gridSize}
                    onChange={(e) => {
                      const size = parseInt(e.target.value);
                      setGridSize(size);
                      // Reset positions if they're out of bounds
                      if (startPos.x >= size || startPos.y >= size) {
                        setStartPos({ x: 0, y: 0 });
                      }
                      if (goalPos.x >= size || goalPos.y >= size) {
                        setGoalPos({ x: size - 1, y: size - 1 });
                      }
                      // Clear path and obstacles when grid size changes
                      setPath([]);
                      setObstacles({});
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-3 font-medium text-lg text-gray-200">{gridSize}×{gridSize}</span>
                </div>
              </div>
              
              <button
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center transition-colors shadow-md border border-green-500"
                onClick={runAlgorithm}
              >
                <Play className="mr-2" size={18} />
                Run {algorithm === 'astar' ? 'A* Search' : 'DFS'}
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-purple-300">
                <Info size={20} className="mr-2 text-blue-400" />
                Path Information
              </h2>
              
              {path.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <span className="font-medium text-gray-200">Path Length:</span>
                    <span className="text-lg font-bold text-green-400">{path.length} steps</span>
                  </div>
                  
                  <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <div className="font-medium mb-2 text-gray-200">Path Sequence:</div>
                    <div className="flex flex-wrap gap-1 text-sm">
                      {path.map((p, index) => (
                        <React.Fragment key={`path-${index}`}>
                          <span className="bg-yellow-800 px-2 py-1 rounded text-yellow-200">({p.x},{p.y})</span>
                          {index < path.length - 1 && <ArrowRight size={16} className="text-gray-500 self-center" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <span className="font-medium text-gray-200">Nodes Explored:</span>
                    <span className="text-lg font-bold text-blue-400">{visited.length}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700 p-4 rounded-lg text-center text-gray-400 flex flex-col items-center border border-gray-600">
                  <RotateCcw size={24} className="mb-2 text-gray-400" />
                  <p>No path found or algorithm not run yet.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Grid and Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center text-purple-300">
                  <MapPin size={20} className="mr-2 text-red-400" />
                  Pathfinding Grid
                </h2>
                
                <div className="flex space-x-2">
                  <div className="flex items-center text-xs text-gray-300">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
                    <span>Start</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-300">
                    <div className="w-3 h-3 bg-green-500 rounded-sm mr-1"></div>
                    <span>Goal</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-300">
                    <div className="w-3 h-3 bg-yellow-500 rounded-sm mr-1"></div>
                    <span>Path</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-center text-sm text-gray-300 mb-2">
                  <Lightbulb size={16} className="mr-2 text-amber-400" />
                  <span className="font-medium">Instructions:</span>
                </div>
                <ul className="text-sm text-gray-300 space-y-1 ml-6 list-disc">
                  <li>Use the buttons below to select what you want to place on the grid</li>
                  <li>Click on a cell to place the selected item (start, goal, or obstacle)</li>
                  <li>Right-click (or Ctrl+click) on a cell to toggle obstacles: Pit (P) → Wumpus (W) → None</li>
                  <li>The selection mode will automatically advance after setting start and goal</li>
                </ul>
              </div>
              
              {/* Selection mode buttons */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  className={`px-3 py-2 rounded-lg flex items-center text-sm ${
                    selectionMode === 'start' 
                      ? 'bg-blue-600 text-white border border-blue-400' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                  onClick={() => setSelectionMode('start')}
                >
                  <span className="font-medium">Set Start Position</span>
                </button>
                
                <button
                  className={`px-3 py-2 rounded-lg flex items-center text-sm ${
                    selectionMode === 'goal' 
                      ? 'bg-green-600 text-white border border-green-400' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                  onClick={() => setSelectionMode('goal')}
                >
                  <span className="font-medium">Set Goal Position</span>
                </button>
                
                <button
                  className={`px-3 py-2 rounded-lg flex items-center text-sm ${
                    selectionMode === 'obstacle' 
                      ? 'bg-gray-600 text-white border border-gray-500' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                  onClick={() => setSelectionMode('obstacle')}
                >
                  <span className="font-medium">Add Obstacles</span>
                </button>
              </div>
              
              <div className="flex justify-center">
                <div className="border border-gray-600 rounded-lg overflow-hidden shadow-lg">
                  {renderGrid()}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-purple-300">Algorithm Details</h2>
              
              <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                {algorithm === 'astar' ? (
                  <div>
                    <h3 className="text-lg font-medium text-blue-300">A* Search Algorithm</h3>
                    <p className="my-2 text-gray-300">
                      A* is an informed search algorithm that finds the shortest path from a start node to a goal node.
                      It uses a heuristic function (in this case, Manhattan distance) to estimate the cost to reach the goal.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-800 p-3 rounded shadow-sm border border-gray-600">
                        <div className="font-medium text-blue-300 mb-1">Complete</div>
                        <p className="text-sm text-gray-300">Yes, A* will always find a solution if one exists.</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded shadow-sm border border-gray-600">
                        <div className="font-medium text-blue-300 mb-1">Optimal</div>
                        <p className="text-sm text-gray-300">Yes, A* finds the shortest path when using an admissible heuristic.</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded shadow-sm border border-gray-600">
                        <div className="font-medium text-blue-300 mb-1">Time Complexity</div>
                        <p className="text-sm text-gray-300">O(b^d) in worst case, where b is the branching factor and d is the depth.</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded shadow-sm border border-gray-600">
                        <div className="font-medium text-blue-300 mb-1">Space Complexity</div>
                        <p className="text-sm text-gray-300">O(b^d) as it stores all generated nodes.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-purple-300">Depth-First Search (DFS) Algorithm</h3>
                    <p className="my-2 text-gray-300">
                      DFS is an uninformed search algorithm that explores as far as possible along each branch before backtracking.
                      It uses a stack data structure to keep track of nodes to visit.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-800 p-3 rounded shadow-sm border border-gray-600">
                        <div className="font-medium text-purple-300 mb-1">Complete</div>
                        <p className="text-sm text-gray-300">Only in finite spaces without cycles.</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded shadow-sm border border-gray-600">
                        <div className="font-medium text-purple-300 mb-1">Optimal</div>
                        <p className="text-sm text-gray-300">No, DFS does not guarantee the shortest path.</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded shadow-sm border border-gray-600">
                        <div className="font-medium text-purple-300 mb-1">Time Complexity</div>
                        <p className="text-sm text-gray-300">O(b^d) where b is the branching factor and d is the depth.</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded shadow-sm border border-gray-600">
                        <div className="font-medium text-purple-300 mb-1">Space Complexity</div>
                        <p className="text-sm text-gray-300">O(d) where d is the maximum depth of the search tree.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-gray-800 to-indigo-900 rounded-lg p-6 shadow-md border border-indigo-800">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">How This Relates to Wumpus World</h2>
              <p className="mb-3 text-gray-300">
                In the Wumpus World game, you need to navigate through a dangerous cave to find gold while avoiding pits and the Wumpus.
                These pathfinding algorithms can help you plan safe routes based on what you've learned about the environment.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-800/80 p-4 rounded-lg shadow-sm border border-blue-900">
                  <h3 className="font-medium text-blue-300 mb-2">A* Search</h3>
                  <p className="text-sm text-gray-300">Use A* when you want to find the shortest safe path to a target like gold or the exit.</p>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-lg shadow-sm border border-blue-900">
                  <h3 className="font-medium text-blue-300 mb-2">DFS</h3>
                  <p className="text-sm text-gray-300">Use DFS when exploring unknown areas of the cave to discover what's there.</p>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-lg shadow-sm border border-blue-900 md:col-span-2">
                  <h3 className="font-medium text-blue-300 mb-2">Obstacle Avoidance</h3>
                  <p className="text-sm text-gray-300">Both algorithms automatically avoid obstacles like pits and the Wumpus, helping you plan safe routes to the gold and back to the exit.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmsPage;