import React from 'react';
import { useRoomSocket } from './hooks/useRoomSocket.js';
import { Lobby } from './components/Lobby.js';
import { SwipeDeck } from './components/SwipeDeck.js';

export const App: React.FC = () => {
  const socket = useRoomSocket();
  const { room, currentUser, peer, partnerProgress, matchedVenue, isDeckExhausted, duelState } = socket;

  const isGameActive = Boolean(
    room &&
    currentUser &&
    (room.status === 'swiping' || room.status === 'matched' || room.status === 'duel')
  );

  return (
    <main className="h-[100dvh] overflow-hidden select-none touch-none bg-[#FBF9F5] text-[#1C1917]">
      {isGameActive && room && currentUser ? (
        <SwipeDeck
          room={room}
          currentUser={currentUser}
          peer={peer}
          partnerProgress={partnerProgress}
          matchedVenue={matchedVenue}
          isDeckExhausted={isDeckExhausted}
          duelState={duelState}
          onSwipe={socket.sendSwipe}
          onLeave={socket.leaveRoom}
          onStartOnlineDuel={() => socket.startDuel('online')}
          onStartSplitDuel={() => socket.startDuel('split')}
          onSendDuelTap={socket.sendDuelTap}
          onResolveSplitDuel={socket.resolveSplitDuel}
        />
      ) : (
        <Lobby socket={socket} />
      )}
    </main>
  );
};

export default App;
