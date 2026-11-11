import React from 'react';
import { Lobby } from './components/Lobby.js';

export const App: React.FC = () => {
  return (
    <main className="h-[100dvh] overflow-hidden select-none touch-none bg-[#FBF9F5] text-[#1C1917]">
      <Lobby />
    </main>
  );
};

export default App;
