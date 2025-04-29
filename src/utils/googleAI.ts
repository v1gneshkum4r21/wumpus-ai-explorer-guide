
// Google AI API integration for Wumpus World
import { GameState } from "../types/game";

interface GoogleAIConfig {
  apiKey: string;
  model: string;
}

let config: GoogleAIConfig | null = null;

// Initialize the Google AI configuration
export const initGoogleAI = (apiKey: string, model: string = "gemini-pro"): void => {
  config = {
    apiKey,
    model
  };
};

// Check if Google AI is configured
export const isGoogleAIConfigured = (): boolean => {
  return config !== null && !!config.apiKey;
};

// Get the AI hint based on the current game state
export const getGoogleAIHint = async (state: GameState): Promise<string> => {
  if (!config || !config.apiKey) {
    return "Google AI not configured. Please provide an API key.";
  }

  try {
    const prompt = generatePrompt(state);
    
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + config.model + ":generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 200,
        }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else if (data.promptFeedback?.blockReason) {
      return `AI response blocked: ${data.promptFeedback.blockReason}`;
    } else {
      console.error("Unexpected Google AI response format:", data);
      return "Unable to generate a hint. Please try again.";
    }
  } catch (error) {
    console.error("Error calling Google AI API:", error);
    return "Error connecting to Google AI. Please check your API key and try again.";
  }
};

// Generate a prompt for the AI based on game state
const generatePrompt = (state: GameState): string => {
  const { agentPosition, agentDirection, percepts, hasGold, hasArrow, grid } = state;
  
  // Count visited cells
  let visitedCells = 0;
  grid.forEach(row => row.forEach(cell => { if (cell.visited) visitedCells++; }));
  
  return `You are an AI assistant helping a player navigate through the Wumpus World game. 
Here's the current game state:
- Position: (${agentPosition.x}, ${agentPosition.y})
- Direction: ${agentDirection}
- Has Gold: ${hasGold}
- Has Arrow: ${hasArrow}
- Percepts: ${JSON.stringify(percepts)}
- Visited cells: ${visitedCells} out of ${state.gridSize * state.gridSize}

Provide a concise hint (max 2 sentences) for the best next move based on this information. Consider:
${percepts.stench ? "- There's a stench, indicating a Wumpus nearby." : ""}
${percepts.breeze ? "- There's a breeze, indicating a pit nearby." : ""}
${percepts.glitter ? "- There's a glitter, suggesting gold in this cell." : ""}
${hasGold ? "- The player has the gold and should return to (0,0)." : "- The player needs to find the gold."}

Only recommend safe moves when possible. Be brief and helpful.`;
};

// Get the best bot action based on Google AI
export const getGoogleBotAction = async (state: GameState): Promise<string> => {
  if (!config || !config.apiKey) {
    return "moveForward"; // Default action if not configured
  }

  try {
    const prompt = `${generatePrompt(state)}

Based on the game state, return ONLY ONE of these actions without any explanation:
"moveForward", "turnLeft", "turnRight", "grab", "shoot", "restart"
`;
    
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + config.model + ":generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
        }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const action = data.candidates[0].content.parts[0].text.trim();
      
      // Make sure we return a valid action
      const validActions = ["moveForward", "turnLeft", "turnRight", "grab", "shoot", "restart"];
      if (validActions.includes(action)) {
        return action;
      } else {
        console.warn("Invalid action returned by Google AI:", action);
        return "moveForward"; // Default to a safe action
      }
    } else {
      console.error("Unexpected Google AI response format:", data);
      return "moveForward";
    }
  } catch (error) {
    console.error("Error calling Google AI API for bot action:", error);
    return "moveForward";
  }
};

