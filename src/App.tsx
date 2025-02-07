import React from 'react';
import Maze from './components/Maze';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">
        Reinforcement Learning Maze
      </h1>
      <div className="bg-white rounded-xl shadow-2xl p-8">
        <Maze />
      </div>
    </div>
  );
}

export default App;