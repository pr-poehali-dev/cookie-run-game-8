import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type GameScreen = 'menu' | 'character-select' | 'game' | 'leaderboard';

interface Character {
  id: string;
  name: string;
  emoji: string;
  speed: number;
  jumpPower: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'barrier' | 'pit';
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
}

const CHARACTERS: Character[] = [
  { id: '1', name: 'Cookie Chocolate', emoji: '🍪', speed: 5, jumpPower: 15 },
  { id: '2', name: 'Cookie Strawberry', emoji: '🧁', speed: 6, jumpPower: 14 },
  { id: '3', name: 'Cookie Gold', emoji: '🥇', speed: 7, jumpPower: 13 },
];

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([
    { name: 'Cookie Pro', score: 5000, level: 10 },
    { name: 'Sweet Runner', score: 3500, level: 7 },
    { name: 'Golden Baker', score: 2100, level: 5 },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState({ x: 100, y: 300, velocityY: 0, isJumping: false });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameCoins, setGameCoins] = useState<Coin[]>([]);
  const [gameSpeed, setGameSpeed] = useState(3);
  const gameLoopRef = useRef<number>();

  useEffect(() => {
    if (screen === 'game' && selectedCharacter && !gameOver) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const gravity = 0.8;
      const groundY = 350;

      const gameLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, 300);
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 300, canvas.width, canvas.height - 300);

        setPlayer(prev => {
          let newY = prev.y + prev.velocityY;
          let newVelocityY = prev.velocityY + gravity;
          let isJumping = prev.isJumping;

          if (newY >= groundY) {
            newY = groundY;
            newVelocityY = 0;
            isJumping = false;
          }

          return { ...prev, y: newY, velocityY: newVelocityY, isJumping };
        });

        ctx.font = '32px Arial';
        ctx.fillText(selectedCharacter.emoji, player.x, player.y);

        setObstacles(prevObstacles => {
          const newObstacles = prevObstacles.map(obs => ({
            ...obs,
            x: obs.x - gameSpeed
          })).filter(obs => obs.x > -100);

          if (Math.random() < 0.02) {
            const obstacleType = Math.random() > 0.5 ? 'barrier' : 'pit';
            newObstacles.push({
              x: canvas.width,
              y: obstacleType === 'barrier' ? groundY - 40 : groundY,
              width: 40,
              height: obstacleType === 'barrier' ? 40 : 20,
              type: obstacleType
            });
          }

          newObstacles.forEach(obs => {
            ctx.fillStyle = obs.type === 'barrier' ? '#3D2817' : '#000';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

            if (
              player.x < obs.x + obs.width &&
              player.x + 30 > obs.x &&
              player.y < obs.y + obs.height &&
              player.y + 30 > obs.y
            ) {
              setGameOver(true);
            }
          });

          return newObstacles;
        });

        setGameCoins(prevCoins => {
          const newCoins = prevCoins.map(coin => ({
            ...coin,
            x: coin.x - gameSpeed
          })).filter(coin => coin.x > -30);

          if (Math.random() < 0.03) {
            newCoins.push({
              x: canvas.width,
              y: groundY - 100 - Math.random() * 100,
              collected: false
            });
          }

          newCoins.forEach(coin => {
            if (!coin.collected) {
              ctx.fillStyle = '#FFD700';
              ctx.beginPath();
              ctx.arc(coin.x, coin.y, 12, 0, Math.PI * 2);
              ctx.fill();

              if (
                player.x < coin.x + 12 &&
                player.x + 30 > coin.x - 12 &&
                player.y < coin.y + 12 &&
                player.y + 30 > coin.y - 12
              ) {
                coin.collected = true;
                setCoins(prev => prev + 1);
                setScore(prev => prev + 100);
              }
            }
          });

          return newCoins.filter(coin => !coin.collected);
        });

        ctx.fillStyle = '#FFB84D';
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText(`Score: ${score}`, 10, 30);
        ctx.fillText(`Coins: ${coins}`, 10, 60);
        ctx.fillText(`Level: ${level}`, 10, 90);

        setScore(prev => prev + 1);

        if (score > 0 && score % 1000 === 0) {
          setLevel(prev => prev + 1);
          setGameSpeed(prev => prev + 0.5);
        }

        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };

      gameLoop();

      return () => {
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current);
        }
      };
    }
  }, [screen, selectedCharacter, gameOver, player.x, player.y, score, coins, level, gameSpeed]);

  useEffect(() => {
    if (gameOver) {
      const newEntry = { name: selectedCharacter?.name || 'Player', score, level };
      setLeaderboard(prev => [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10));
    }
  }, [gameOver]);

  const handleJump = () => {
    if (!player.isJumping && screen === 'game') {
      setPlayer(prev => ({
        ...prev,
        velocityY: -selectedCharacter!.jumpPower,
        isJumping: true
      }));
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [screen, player.isJumping]);

  const startGame = () => {
    if (selectedCharacter) {
      setScore(0);
      setCoins(0);
      setLevel(1);
      setGameOver(false);
      setPlayer({ x: 100, y: 300, velocityY: 0, isJumping: false });
      setObstacles([]);
      setGameCoins([]);
      setGameSpeed(3);
      setScreen('game');
    }
  };

  const renderMenu = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FFB84D] to-[#FA90E2] p-8">
      <div className="text-center space-y-12">
        <h1 className="text-6xl pixel-text text-[#3D2817] mb-8 drop-shadow-[4px_4px_0px_#FFB84D]">
          COOKIE RUN
        </h1>
        
        <div className="space-y-6">
          <Button
            onClick={() => setScreen('character-select')}
            className="w-64 h-16 bg-[#FFB84D] hover:bg-[#FFA500] text-[#3D2817] text-xl pixel-text border-4 border-[#3D2817] shadow-[4px_4px_0px_#3D2817] hover:shadow-[2px_2px_0px_#3D2817] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            ИГРАТЬ
          </Button>
          
          <Button
            onClick={() => setScreen('leaderboard')}
            className="w-64 h-16 bg-[#FA90E2] hover:bg-[#FF69B4] text-[#3D2817] text-xl pixel-text border-4 border-[#3D2817] shadow-[4px_4px_0px_#3D2817] hover:shadow-[2px_2px_0px_#3D2817] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            РЕЙТИНГ
          </Button>
        </div>

        <div className="mt-12 text-[#3D2817] text-sm pixel-text">
          Нажми ПРОБЕЛ для прыжка
        </div>
      </div>
    </div>
  );

  const renderCharacterSelect = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#87CEEB] to-[#FFB84D] p-8">
      <div className="text-center space-y-8">
        <h2 className="text-4xl pixel-text text-[#3D2817] mb-8">
          ВЫБЕРИ ПЕРСОНАЖА
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CHARACTERS.map((char) => (
            <Card
              key={char.id}
              onClick={() => setSelectedCharacter(char)}
              className={`p-6 cursor-pointer border-4 border-[#3D2817] bg-white transition-all hover:scale-105 ${
                selectedCharacter?.id === char.id ? 'shadow-[8px_8px_0px_#FFB84D] scale-105' : 'shadow-[4px_4px_0px_#3D2817]'
              }`}
            >
              <div className="text-6xl mb-4">{char.emoji}</div>
              <h3 className="text-lg pixel-text text-[#3D2817] mb-2">{char.name}</h3>
              <div className="text-xs pixel-text text-[#3D2817] space-y-1">
                <div>Скорость: {char.speed}</div>
                <div>Прыжок: {char.jumpPower}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <Button
            onClick={() => setScreen('menu')}
            className="w-48 h-14 bg-[#FA90E2] hover:bg-[#FF69B4] text-[#3D2817] text-lg pixel-text border-4 border-[#3D2817] shadow-[4px_4px_0px_#3D2817]"
          >
            НАЗАД
          </Button>
          
          {selectedCharacter && (
            <Button
              onClick={startGame}
              className="w-48 h-14 bg-[#FFB84D] hover:bg-[#FFA500] text-[#3D2817] text-lg pixel-text border-4 border-[#3D2817] shadow-[4px_4px_0px_#3D2817]"
            >
              СТАРТ
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#87CEEB] to-[#8B4513] p-8">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="border-4 border-[#3D2817] shadow-[8px_8px_0px_#3D2817] bg-white"
        onClick={handleJump}
      />
      
      <div className="mt-4 text-center pixel-text text-white text-sm">
        Нажми ПРОБЕЛ или экран для прыжка
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <Card className="p-8 border-4 border-[#3D2817] bg-white text-center space-y-4">
            <h2 className="text-3xl pixel-text text-[#3D2817]">ИГРА ОКОНЧЕНА!</h2>
            <div className="text-xl pixel-text text-[#3D2817]">
              <div>Счет: {score}</div>
              <div>Монеты: {coins}</div>
              <div>Уровень: {level}</div>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={startGame}
                className="bg-[#FFB84D] hover:bg-[#FFA500] text-[#3D2817] pixel-text border-4 border-[#3D2817]"
              >
                ЕЩЁ РАЗ
              </Button>
              <Button
                onClick={() => setScreen('menu')}
                className="bg-[#FA90E2] hover:bg-[#FF69B4] text-[#3D2817] pixel-text border-4 border-[#3D2817]"
              >
                МЕНЮ
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const renderLeaderboard = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FA90E2] to-[#FFB84D] p-8">
      <div className="text-center space-y-8 w-full max-w-2xl">
        <h2 className="text-4xl pixel-text text-[#3D2817] mb-8">
          ТАБЛИЦА ЛИДЕРОВ
        </h2>

        <Card className="p-6 border-4 border-[#3D2817] bg-white shadow-[8px_8px_0px_#3D2817]">
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border-2 border-[#3D2817] bg-[#FFB84D]/20"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl pixel-text text-[#3D2817] w-12">
                    #{index + 1}
                  </span>
                  <div className="text-left">
                    <div className="text-lg pixel-text text-[#3D2817]">{entry.name}</div>
                    <div className="text-xs pixel-text text-[#3D2817]/70">Уровень {entry.level}</div>
                  </div>
                </div>
                <div className="text-xl pixel-text text-[#3D2817]">{entry.score}</div>
              </div>
            ))}
          </div>
        </Card>

        <Button
          onClick={() => setScreen('menu')}
          className="w-48 h-14 bg-[#FFB84D] hover:bg-[#FFA500] text-[#3D2817] text-lg pixel-text border-4 border-[#3D2817] shadow-[4px_4px_0px_#3D2817]"
        >
          НАЗАД
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {screen === 'menu' && renderMenu()}
      {screen === 'character-select' && renderCharacterSelect()}
      {screen === 'game' && renderGame()}
      {screen === 'leaderboard' && renderLeaderboard()}
    </>
  );
};

export default Index;
