import React, { useState, useEffect, useRef } from 'react';

const NumberClickGame = () => {
  // State chính của trò chơi
  const [numPoints, setNumPoints] = useState(10);
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'ended'
  const [currentNumber, setCurrentNumber] = useState(1);
  const [points, setPoints] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [message, setMessage] = useState('');
  const [bestTime, setBestTime] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Refs để quản lý timers
  const gameTimerRef = useRef(null);
  const pointTimerRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Khởi tạo khi component mount
  useEffect(() => {
    // Cleanup khi component unmount
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (pointTimerRef.current) clearInterval(pointTimerRef.current);
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  // Tạo vị trí ngẫu nhiên cho các điểm
  const generateRandomPoints = (count) => {
    const newPoints = [];
    const minDistance = 80; // Khoảng cách tối thiểu giữa các điểm
    
    for (let i = 1; i <= count; i++) {
      let x, y;
      let attempts = 0;
      
      // Tạo vị trí ngẫu nhiên, đảm bảo không chồng lấp
      do {
        x = Math.random() * 75 + 12.5; // 12.5% đến 87.5%
        y = Math.random() * 65 + 17.5; // 17.5% đến 82.5%
        attempts++;
      } while (attempts < 50 && newPoints.some(point => {
        const dx = Math.abs(point.x - x);
        const dy = Math.abs(point.y - y);
        return Math.sqrt(dx * dx + dy * dy) < minDistance / 10;
      }));
      
      newPoints.push({
        id: i,
        x: x,
        y: y,
        visible: true,
        clicked: false
      });
    }
    return newPoints;
  };

  // Bắt đầu trò chơi
  const startGame = () => {
    setGameState('playing');
    setCurrentNumber(1);
    setPoints(generateRandomPoints(numPoints));
    setTimeLeft(0);
    setGameTime(0);
    setMessage('');
    setGameStarted(false);
    
    // Dọn dẹp timers cũ
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (pointTimerRef.current) clearInterval(pointTimerRef.current);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    
    // Bắt đầu đếm thời gian trò chơi
    gameTimerRef.current = setInterval(() => {
      setGameTime(prev => prev + 0.1);
    }, 100);
  };

  // Bắt đầu đếm ngược thời gian cho điểm hiện tại
  const startPointTimer = () => {
    setTimeLeft(3);
    
    if (pointTimerRef.current) {
      clearInterval(pointTimerRef.current);
    }
    
    pointTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          endGame('Hết thời gian! Điểm số đã biến mất.');
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
  };

  // Kết thúc trò chơi
  const endGame = (reason) => {
    setGameState('ended');
    setMessage(reason);
    
    // Dọn dẹp tất cả timers
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }
    if (pointTimerRef.current) {
      clearInterval(pointTimerRef.current);
    }
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    
    // Cập nhật kỷ lục nếu hoàn thành thành công
    if (reason.includes('Chúc mừng') && (!bestTime || gameTime < bestTime)) {
      const newBestTime = parseFloat(gameTime.toFixed(1));
      setBestTime(newBestTime);
    }
  };

  // Xử lý khi click vào một điểm
  const handlePointClick = (pointId) => {
    if (gameState !== 'playing') return;
    
    // Kiểm tra click đúng số
    if (pointId !== currentNumber) {
      endGame('Sai thứ tự! Bạn phải click theo thứ tự từ 1, 2, 3...');
      return;
    }
    
    // Xử lý điểm đầu tiên
    if (currentNumber === 1) {
      setGameStarted(true);
      // Đánh dấu điểm đã click
      setPoints(prev => prev.map(p => 
        p.id === pointId ? { ...p, clicked: true } : p
      ));
      
      // Chuyển sang số tiếp theo
      setCurrentNumber(2);
      
      // Kiểm tra nếu chỉ có 1 điểm
      if (numPoints === 1) {
        endGame('Chúc mừng! Bạn đã hoàn thành trò chơi!');
        return;
      }
      
      // Bắt đầu đếm thời gian cho điểm tiếp theo
      startPointTimer();
      return;
    }
    
    // Xử lý các điểm tiếp theo
    // Kiểm tra click quá nhanh (trong 1 giây đầu)
    if (timeLeft > 2) {
      endGame('Click quá nhanh! Phải đợi ít nhất 1 giây.');
      return;
    }

    // Đánh dấu điểm đã click
    setPoints(prev => prev.map(p => 
      p.id === pointId ? { ...p, clicked: true } : p
    ));
    
    // Kiểm tra hoàn thành trò chơi
    if (currentNumber === numPoints) {
      endGame('Chúc mừng! Bạn đã hoàn thành trò chơi!');
      return;
    }
    
    // Chuyển sang số tiếp theo
    setCurrentNumber(prev => prev + 1);
    
    // Bắt đầu đếm thời gian cho điểm tiếp theo
    startPointTimer();
  };

  // Auto play functionality - Sửa lại logic
  useEffect(() => {
    if (autoPlay && gameState === 'playing') {
      // Dọn dẹp timer cũ nếu có
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
      
      autoPlayRef.current = setInterval(() => {
        // Auto click điểm đầu tiên ngay lập tức
        if (currentNumber === 1) {
          handlePointClick(1);
        }
        // Auto click các điểm khác khi thời gian còn lại khoảng 1-0.5 giây
        else if (gameStarted && timeLeft > 0 && timeLeft <= 1.5 && timeLeft >= 0.5) {
          handlePointClick(currentNumber);
        }
      }, 50); // Giảm interval để responsive hơn
    } else if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [autoPlay, gameState, timeLeft, currentNumber, gameStarted]);

  // Reset trò chơi
  const resetGame = () => {
    setGameState('setup');
    setCurrentNumber(1);
    setPoints([]);
    setTimeLeft(0);
    setGameTime(0);
    setMessage('');
    setGameStarted(false);
    
    // Dọn dẹp timers
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (pointTimerRef.current) clearInterval(pointTimerRef.current);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  // Render component
  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-3 text-5xl font-bold text-white drop-shadow-lg">
            🎯 Click Số Theo Thứ Tự
          </h1>
          <p className="text-lg text-blue-200">
            Click vào các số theo đúng thứ tự trước khi chúng biến mất!
          </p>
        </div>

        {/* Game Controls */}
        <div className="p-6 mb-6 shadow-2xl bg-white/10 backdrop-blur-sm rounded-xl">
          <div className="flex flex-wrap items-center justify-center gap-6">
            
            {/* Số điểm */}
            <div className="flex items-center gap-3">
              <label className="text-lg font-semibold text-white">📊 Số điểm:</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={numPoints}
                onChange={(e) => setNumPoints(Math.max(1, Math.min(1000, parseInt(e.target.value) || 10)))}
                disabled={gameState === 'playing'}
                className="w-20 px-3 py-2 text-lg font-bold text-center text-white border-2 rounded-lg bg-white/20 placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            
            {/* Nút Start/Restart */}
            <button
              onClick={gameState === 'setup' ? startGame : resetGame}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
                gameState === 'setup' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
              }`}
            >
              {gameState === 'setup' ? '🚀 Bắt đầu' : '🔄 Restart'}
            </button>
            
            {/* Auto Play */}
            <div className="flex items-center gap-3">
              <label className="text-lg font-semibold text-white">🤖 Auto Play:</label>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`px-6 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
                  autoPlay 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black' 
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
                }`}
              >
                {autoPlay ? '✅ ON' : '❌ OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Game Statistics */}
        <div className="p-6 mb-6 shadow-2xl bg-white/10 backdrop-blur-sm rounded-xl">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4 lg:grid-cols-6">
            
            {/* Thời gian */}
            <div className="p-4 rounded-lg bg-blue-500/20">
              <div className="text-3xl font-bold text-white">{gameTime.toFixed(1)}s</div>
              <div className="text-sm text-blue-200">⏱️ Thời gian</div>
            </div>

            {/* Số tiếp theo */}
            {gameState === 'playing' && (
              <div className="p-4 rounded-lg bg-yellow-500/20">
                <div className="text-3xl font-bold text-white">{currentNumber}</div>
                <div className="text-sm text-yellow-200">🎯 Số tiếp theo</div>
              </div>
            )}
            
            {/* Thời gian còn lại */}
            {gameState === 'playing' && gameStarted && (
              <div className="p-4 rounded-lg bg-red-500/20">
                <div className="text-3xl font-bold text-white">{timeLeft.toFixed(1)}s</div>
                <div className="text-sm text-red-200">⏰ Còn lại</div>
              </div>
            )}
            
            {/* Tiến độ */}
            {gameState === 'playing' && (
              <div className="p-4 rounded-lg bg-purple-500/20">
                <div className="text-3xl font-bold text-white">{currentNumber - 1}/{numPoints}</div>
                <div className="text-sm text-purple-200">📈 Tiến độ</div>
              </div>
            )}
            
            {/* Kỷ lục */}
            {bestTime && (
              <div className="p-4 rounded-lg bg-orange-500/20">
                <div className="text-3xl font-bold text-orange-300">{bestTime}s</div>
                <div className="text-sm text-orange-200">👑 Kỷ lục</div>
              </div>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div className="relative bg-white/5 backdrop-blur-sm rounded-xl h-96 md:h-[500px] overflow-hidden shadow-2xl border border-white/10">
          
          {/* Setup State */}
          {gameState === 'setup' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4 text-6xl">🎮</div>
                <div className="mb-4 text-3xl font-bold">Sẵn sàng chơi!</div>
                <div className="text-lg text-blue-200">
                  Nhấn "Bắt đầu" để bắt đầu trò chơi với {numPoints} điểm
                </div>
                {autoPlay && (
                  <div className="mt-4 text-yellow-300">
                    🤖 Auto Play đang BẬT - máy sẽ tự chơi
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Playing State */}
          {gameState === 'playing' && points.map((point) => (
            !point.clicked && (
              <div
                key={point.id}
                className="absolute"
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  transform: `translate(-50%, -50%)`,
                  zIndex: numPoints - point.id + 1
                }}
              >
                <button
                  onClick={() => handlePointClick(point.id)}
                  className={`w-14 h-14 rounded-full font-bold text-xl transition-all transform hover:scale-110 shadow-lg ${
                    point.id === currentNumber 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black animate-pulse ring-4 ring-yellow-300' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white opacity-60 hover:opacity-80'
                  }`}
                >
                  {point.id}
                </button>
                
                {/* Hiển thị thông tin cho điểm hiện tại */}
                {point.id === currentNumber && (
                  <div className="absolute text-center transform -translate-x-1/2 top-16 left-1/2" style={{ zIndex: 1000 }}>
                    <div className="px-3 py-2 text-sm font-bold text-white rounded-lg shadow-lg bg-black/70">
                      {!gameStarted ? (
                        <span className="text-green-300">
                          {autoPlay ? '🤖 Auto: Đang chờ...' : '🚀 Click để bắt đầu'}
                        </span>
                      ) : (
                        <span className={timeLeft <= 1 ? 'text-red-300' : 'text-white'}>
                          {autoPlay ? '🤖 Auto: ' : '⏱️ '}{timeLeft.toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          ))}
          
          {/* Game Over State */}
          {gameState === 'ended' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-md p-8 text-center text-white bg-black/70 rounded-xl">
                <div className="mb-4 text-4xl">
                  {message.includes('Chúc mừng') ? '🎉' : '😞'}
                </div>
                <div className="mb-4 text-2xl font-bold">
                  {message.includes('Chúc mừng') ? 'Thành công!' : 'Trò chơi kết thúc!'}
                </div>
                <div className="mb-6 text-lg text-blue-200">{message}</div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-green-500/20">
                    <div className="text-2xl font-bold text-yellow-400">{gameTime.toFixed(1)}s</div>
                    <div className="text-sm text-green-200">Thời gian</div>
                  </div>
                </div>
                
                {message.includes('Chúc mừng') && bestTime === parseFloat(gameTime.toFixed(1)) && (
                  <div className="mb-4 font-bold text-orange-300">
                    🏆 Kỷ lục mới!
                  </div>
                )}
                
                {autoPlay && (
                  <div className="mb-4 text-yellow-300">
                    🤖 Chế độ Auto Play
                  </div>
                )}
                
                <button
                  onClick={resetGame}
                  className="px-6 py-3 font-bold text-white transition-all transform rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105"
                >
                  🔄 Chơi lại
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Game Instructions */}
        <div className="p-6 mt-6 shadow-2xl bg-white/10 backdrop-blur-sm rounded-xl">
          <h3 className="mb-4 text-xl font-bold text-center text-white">📋 Hướng dẫn chơi</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold text-yellow-300">🎯 Cách chơi:</h4>
              <ul className="space-y-1 text-sm text-blue-200">
                <li>• Click vào các số theo đúng thứ tự (1 → 2 → 3 → ...)</li>
                <li>• Điểm đầu tiên: Click để bắt đầu đếm thời gian</li>
                <li>• Các điểm tiếp theo: Có 3 giây để click</li>
                <li>• Không được click quá nhanh (đợi ít nhất 1 giây)</li>
                <li>• 🤖 Auto Play: Máy tự chơi hoàn toàn tự động</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-yellow-300">🏆 Tính điểm:</h4>
              <ul className="space-y-1 text-sm text-blue-200">
                <li>• Click càng nhanh (trong giây cuối) = điểm càng cao</li>
                <li>• Hoàn thành nhanh nhất = kỷ lục mới</li>
                <li>• Auto Play giúp test tốc độ tối đa</li>
                <li>• Thử thách bản thân với nhiều điểm hơn!</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-white/60">
          <p>💡 Mẹo: Quan sát kỹ vị trí các số trước khi bắt đầu!</p>
          <p className="mt-2">🤖 Auto Play: Bật để xem máy chơi tự động</p>
        </div>
      </div>
    </div>
  );
};

export default NumberClickGame;