import React, { useEffect, useRef, useState } from 'react';
import { Brain, Target, Settings, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  reward: number;
  qValues: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
}

type Action = 'up' | 'down' | 'left' | 'right';
type AgentType = '🤖' | '🐱' | '🦊' | '🐼' | '🦁';

const MAZE_SIZE = 10;
const LEARNING_RATE = 0.1;
const DISCOUNT_FACTOR = 0.9;
const EPSILON = 0.1;

const Maze: React.FC = () => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
  const [goalPos, setGoalPos] = useState({ x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 });
  const [isTraining, setIsTraining] = useState(false);
  const [episode, setEpisode] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(500); // milliseconds
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('🤖');
  const [lastAction, setLastAction] = useState<string>('');
  const [isSettingStart, setIsSettingStart] = useState(false);
  const [isSettingGoal, setIsSettingGoal] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize maze
  useEffect(() => {
    const newMaze: Cell[][] = [];
    for (let y = 0; y < MAZE_SIZE; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < MAZE_SIZE; x++) {
        row.push({
          x,
          y,
          isWall: Math.random() < 0.2 && !(x === 0 && y === 0) && !(x === MAZE_SIZE - 1 && y === MAZE_SIZE - 1),
          reward: x === goalPos.x && y === goalPos.y ? 1000 : -1,
          qValues: { up: 0, down: 0, left: 0, right: 0 },
        });
      }
      newMaze.push(row);
    }
    setMaze(newMaze);
  }, []);

  const getValidActions = (pos: { x: number; y: number }): Action[] => {
    const actions: Action[] = [];
    if (pos.y > 0 && !maze[pos.y - 1][pos.x].isWall) actions.push('up');
    if (pos.y < MAZE_SIZE - 1 && !maze[pos.y + 1][pos.x].isWall) actions.push('down');
    if (pos.x > 0 && !maze[pos.y][pos.x - 1].isWall) actions.push('left');
    if (pos.x < MAZE_SIZE - 1 && !maze[pos.y][pos.x + 1].isWall) actions.push('right');
    return actions;
  };

  const getNextState = (pos: { x: number; y: number }, action: Action) => {
    switch (action) {
      case 'up': return { x: pos.x, y: pos.y - 1 };
      case 'down': return { x: pos.x, y: pos.y + 1 };
      case 'left': return { x: pos.x - 1, y: pos.y };
      case 'right': return { x: pos.x + 1, y: pos.y };
    }
  };

  const chooseAction = (pos: { x: number; y: number }): Action => {
    const validActions = getValidActions(pos);
    if (Math.random() < EPSILON) {
      return validActions[Math.floor(Math.random() * validActions.length)];
    }
    const currentCell = maze[pos.y][pos.x];
    let bestAction = validActions[0];
    let bestValue = currentCell.qValues[bestAction];
    
    validActions.forEach(action => {
      const value = currentCell.qValues[action];
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    });
    
    return bestAction;
  };

  const updateQValue = (state: { x: number; y: number }, action: Action, nextState: { x: number; y: number }) => {
    const currentQ = maze[state.y][state.x].qValues[action];
    const nextMaxQ = Math.max(...Object.values(maze[nextState.y][nextState.x].qValues));
    const reward = maze[nextState.y][nextState.x].reward;
    
    const newQ = currentQ + LEARNING_RATE * (reward + DISCOUNT_FACTOR * nextMaxQ - currentQ);
    
    setMaze(prev => {
      const newMaze = [...prev];
      newMaze[state.y][state.x] = {
        ...newMaze[state.y][state.x],
        qValues: {
          ...newMaze[state.y][state.x].qValues,
          [action]: newQ,
        },
      };
      return newMaze;
    });
    
    return reward;
  };

  const trainStep = () => {
    if (agentPos.x === goalPos.x && agentPos.y === goalPos.y) {
      setAgentPos({ x: 0, y: 0 });
      setEpisode(prev => prev + 1);
      return;
    }

    const action = chooseAction(agentPos);
    const nextState = getNextState(agentPos, action);
    const reward = updateQValue(agentPos, action, nextState);
    
    setLastAction(`Action: ${action}, Reward: ${reward}`);
    setTotalReward(prev => prev + reward);
    setAgentPos(nextState);
  };

  useEffect(() => {
    if (isTraining) {
      animationTimeoutRef.current = setTimeout(() => trainStep(), animationSpeed);
    }
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [isTraining, agentPos, maze]);

  const handleCellClick = (x: number, y: number) => {
    if (isSettingStart) {
      setAgentPos({ x, y });
      setIsSettingStart(false);
    } else if (isSettingGoal) {
      setGoalPos({ x, y });
      setIsSettingGoal(false);
      // Update rewards
      setMaze(prev => {
        const newMaze = [...prev];
        for (let i = 0; i < MAZE_SIZE; i++) {
          for (let j = 0; j < MAZE_SIZE; j++) {
            newMaze[i][j].reward = (j === x && i === y) ? 100 : -10;
          }
        }
        return newMaze;
      });
    }
  };

  const getActionArrow = (action: Action) => {
    switch (action) {
      case 'up': return <ChevronUp className="w-4 h-4" />;
      case 'down': return <ChevronDown className="w-4 h-4" />;
      case 'left': return <ChevronLeft className="w-4 h-4" />;
      case 'right': return <ChevronRight className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8 bg-gray-900 text-white min-h-screen">
      <div className="flex flex-wrap gap-4 items-center justify-center">
        <button
          onClick={() => setIsTraining(prev => !prev)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            isTraining ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          } text-white transition-colors`}
        >
          <Brain className="w-5 h-5" />
          {isTraining ? 'Stop Training' : 'Start Training'}
        </button>

        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg">
          <label className="text-sm">Speed:</label>
          <input
            type="range"
            min="100"
            max="2000"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm">{animationSpeed}ms</span>
        </div>

        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg">
          <label className="text-sm">Agent:</label>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value as AgentType)}
            className="bg-gray-700 rounded px-2 py-1"
          >
            <option value="🤖">🤖 Robot</option>
            <option value="🐱">🐱 Cat</option>
            <option value="🦊">🦊 Fox</option>
            <option value="🐼">🐼 Panda</option>
            <option value="🦁">🦁 Lion</option>
          </select>
        </div>

        <button
          onClick={() => {
            setIsSettingStart(true);
            setIsSettingGoal(false);
          }}
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
        >
          <Settings className="w-5 h-5" />
          Set Start
        </button>

        <button
          onClick={() => {
            setIsSettingGoal(true);
            setIsSettingStart(false);
          }}
          className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 flex items-center gap-2"
        >
          <Target className="w-5 h-5" />
          Set Goal
        </button>
      </div>

      <div className="flex gap-4 items-center bg-gray-800 p-4 rounded-lg">
        <div className="text-lg">Episode: {episode}</div>
        <div className="text-lg">Total Reward: {totalReward}</div>
      </div>
      
      <div className="grid gap-1 p-6 bg-gray-800 rounded-xl shadow-2xl">
        {maze.map((row, y) => (
          <div key={y} className="flex gap-1">
            {row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                onClick={() => !cell.isWall && handleCellClick(x, y)}
                className={`w-16 h-16 flex items-center justify-center relative transition-all duration-300 ${
                  cell.isWall ? 'bg-gray-900' : 'bg-gray-700'
                } ${
                  x === goalPos.x && y === goalPos.y ? 'bg-green-900' : ''
                } ${
                  (isSettingStart || isSettingGoal) && !cell.isWall ? 'cursor-pointer hover:bg-gray-600' : ''
                } rounded-lg shadow-lg`}
              >
                {!cell.isWall && (
                  <div className="absolute inset-0 bg-blue-500 opacity-20"
                       style={{
                         opacity: Math.max(...Object.values(cell.qValues)) / 100 * 0.5
                       }}
                  />
                )}
                {agentPos.x === x && agentPos.y === y && (
                  <span className="text-3xl animate-bounce">{selectedAgent}</span>
                )}
                {x === goalPos.x && y === goalPos.y && (
                  <span className="text-3xl">🎯</span>
                )}
                {!cell.isWall && !cell.isWall && !(agentPos.x === x && agentPos.y === y) && !(x === goalPos.x && y === goalPos.y) && (
                  <div className="absolute bottom-1 right-1 flex gap-1">
                    {Object.entries(cell.qValues).map(([action, value]) => (
                      value > 0 && (
                        <div key={action} className="text-xs flex items-center text-blue-300">
                          {getActionArrow(action as Action)}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="bg-gray-800 p-4 rounded-lg w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-2">Training Information</h3>
        <p className="text-gray-300">{lastAction}</p>
      </div>
    </div>
  );
};

export default Maze;
