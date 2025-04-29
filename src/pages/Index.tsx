
import React, { useState, useEffect, useCallback } from "react";
import { GameState, Action } from "@/types/game";
import { createNewGame, performAction } from "@/utils/gameLogic";
import { getAiHint, getBotAction } from "@/utils/aiHelpers";
import { getGoogleAIHint, getGoogleBotAction, isGoogleAIConfigured } from "@/utils/googleAI";
import GameGrid from "@/components/GameGrid";
import PerceptDisplay from "@/components/PerceptDisplay";
import ActionButtons from "@/components/ActionButtons";
import AIHint from "@/components/AIHint";
import BotModeToggle from "@/components/BotModeToggle";
import GoogleAIConfig from "@/components/GoogleAIConfig";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CircleHelp,
  Trophy,
  Skull,
} from "lucide-react";

const Index = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>(createNewGame);
  const [hint, setHint] = useState<string>("Welcome to Wumpus World! I'll help guide you through the cave.");
  const [botMode, setBotMode] = useState<boolean>(false);
  const [hintLoading, setHintLoading] = useState<boolean>(false);
  const [botInterval, setBotInterval] = useState<NodeJS.Timeout | null>(null);
  const [useGoogleAI, setUseGoogleAI] = useState<boolean>(false);
  const [googleAIConfigured, setGoogleAIConfigured] = useState<boolean>(isGoogleAIConfigured());

  // Handle player actions
  const handleAction = useCallback((action: Action) => {
    setGameState((prevState) => {
      const newState = performAction(prevState, action);
      
      // Show appropriate toast for game events
      if (action !== "restart") {
        if (newState.gameOver && !prevState.gameOver) {
          toast.error("Game Over! You died in the cave.", {
            icon: <Skull className="text-red-500" />,
          });
        } else if (newState.gameWon && !prevState.gameWon) {
          toast.success("Congratulations! You've won the game!", {
            icon: <Trophy className="text-yellow-500" />,
          });
        } else if (newState.percepts.bump) {
          toast.warning("Bump! You hit a wall.");
        } else if (newState.percepts.scream) {
          toast.info("You hear a scream! Your arrow hit the Wumpus!");
        }
      }
      
      return newState;
    });
  }, []);
  
  // Get a new AI hint
  const refreshHint = useCallback(async () => {
    setHintLoading(true);
    
    try {
      let newHint;
      if (useGoogleAI && googleAIConfigured) {
        newHint = await getGoogleAIHint(gameState);
      } else {
        // Fallback to built-in AI helper
        newHint = getAiHint(gameState);
      }
      setHint(newHint);
    } catch (error) {
      console.error("Error getting AI hint:", error);
      setHint("Error getting AI hint. Please try again.");
    } finally {
      setHintLoading(false);
    }
  }, [gameState, useGoogleAI, googleAIConfigured]);
  
  // Effect to refresh hint when game state changes
  useEffect(() => {
    refreshHint();
  }, [gameState, refreshHint]);
  
  // Effect to handle bot mode
  useEffect(() => {
    // Clear any existing interval
    if (botInterval) {
      clearInterval(botInterval);
      setBotInterval(null);
    }
    
    // If bot mode is enabled and game is active, start the bot
    if (botMode && !gameState.gameOver && !gameState.gameWon) {
      const interval = setInterval(async () => {
        try {
          let action;
          if (useGoogleAI && googleAIConfigured) {
            action = await getGoogleBotAction(gameState);
          } else {
            action = getBotAction(gameState);
          }
          handleAction(action as Action);
        } catch (error) {
          console.error("Error in bot mode:", error);
          setBotMode(false);
          toast.error("Bot mode encountered an error and has been deactivated.");
        }
      }, 1000); // Make a move every second
      
      setBotInterval(interval);
      
      // Notify user that bot mode is active
      toast.info(`${useGoogleAI ? "Google AI" : "AI"} bot mode activated. The AI will play automatically.`);
    }
    
    return () => {
      if (botInterval) clearInterval(botInterval);
    };
  }, [botMode, gameState, handleAction, useGoogleAI, googleAIConfigured]);
  
  // Stop bot mode when game ends
  useEffect(() => {
    if ((gameState.gameOver || gameState.gameWon) && botMode) {
      setBotMode(false);
    }
  }, [gameState.gameOver, gameState.gameWon, botMode]);

  // Handle Google AI configuration
  const handleGoogleAIConfigured = useCallback((configured: boolean) => {
    setGoogleAIConfigured(configured);
    if (configured && !useGoogleAI) {
      setUseGoogleAI(true);
      toast.success("Google AI configured. Switching to Google AI for hints and bot mode.");
    }
  }, [useGoogleAI]);

  // Toggle Google AI usage
  const toggleGoogleAI = useCallback(() => {
    if (!googleAIConfigured) {
      toast.error("Please configure Google AI first");
      return;
    }
    
    setUseGoogleAI(prev => !prev);
    refreshHint();
  }, [googleAIConfigured, refreshHint]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold text-wumpus-accent mb-2">Wumpus World</h1>
          <p className="text-lg text-muted-foreground">
            Navigate through a dangerous cave to find gold and escape!
          </p>
        </header>

        {/* Game status */}
        <div className="mb-6">
          {gameState.gameOver && (
            <div className="bg-red-950/30 border border-red-800 text-red-400 p-4 rounded-lg text-center">
              <h2 className="text-2xl font-bold flex justify-center items-center">
                <Skull className="mr-2" size={24} />
                Game Over!
              </h2>
              <p>You died in the cave. Score: {gameState.score}</p>
            </div>
          )}
          
          {gameState.gameWon && (
            <div className="bg-green-950/30 border border-green-800 text-green-400 p-4 rounded-lg text-center">
              <h2 className="text-2xl font-bold flex justify-center items-center">
                <Trophy className="mr-2" size={24} />
                Victory!
              </h2>
              <p>You found the gold and escaped! Score: {gameState.score}</p>
            </div>
          )}
          
          {!gameState.gameOver && !gameState.gameWon && (
            <div className="bg-card p-2 rounded-lg flex justify-between items-center">
              <div className="text-sm">
                <span className="text-muted-foreground">Position:</span>{" "}
                ({gameState.agentPosition.x}, {gameState.agentPosition.y})
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Direction:</span>{" "}
                {gameState.agentDirection.charAt(0).toUpperCase() + gameState.agentDirection.slice(1)}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Score:</span>{" "}
                {gameState.score}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Moves:</span>{" "}
                {gameState.moves}
              </div>
            </div>
          )}
        </div>

        <div className="game-layout">
          <div className="game-info">
            {/* Google AI Configuration */}
            <GoogleAIConfig onConfigured={handleGoogleAIConfigured} />
            
            <div className="mb-6">
              <PerceptDisplay percepts={gameState.percepts} />
            </div>
            
            <div className="mb-6">
              <ActionButtons
                onAction={handleAction}
                hasArrow={gameState.hasArrow}
                hasGold={gameState.hasGold}
                gameOver={gameState.gameOver}
                gameWon={gameState.gameWon}
              />
            </div>
            
            <div className="mb-6">
              <AIHint 
                hint={hint} 
                isLoading={hintLoading} 
                isGoogleAI={useGoogleAI && googleAIConfigured}
              />
              <div className="flex justify-between mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleGoogleAI}
                  className="text-xs"
                  disabled={!googleAIConfigured}
                >
                  {useGoogleAI ? "Use Built-in AI" : "Use Google AI"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshHint}
                  className="text-xs"
                  disabled={hintLoading}
                >
                  <CircleHelp className="mr-1" size={14} />
                  New Hint
                </Button>
              </div>
            </div>
            
            <BotModeToggle
              botMode={botMode}
              onToggle={setBotMode}
              disabled={gameState.gameOver || gameState.gameWon}
              isGoogleAI={useGoogleAI && googleAIConfigured}
            />
          </div>
          
          <div className="game-board">
            <GameGrid gameState={gameState} />
            
            <div className="mt-4 bg-card p-3 rounded-lg text-sm shadow-md">
              <h3 className="font-medium mb-1">Game Instructions:</h3>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>Find the gold and return to the starting position (0,0)</li>
                <li>Watch out for the Wumpus and pits - they'll kill you!</li>
                <li>Use your percepts to infer danger: Stench = Wumpus nearby, Breeze = Pit nearby</li>
                <li>You have one arrow to shoot the Wumpus</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
