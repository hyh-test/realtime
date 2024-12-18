import { CLIENT_VERSION } from './Constants.js';

const socket = io('http://localhost:3000', {
  query: {
    clientVersion: CLIENT_VERSION,
  },
});

let userId = null;
let gameAssets = null;
let onAssetsLoadedCallback = null;
let scoreUpdateCallback = null;

socket.on('response', (data) => {
  console.log('서버 응답:', data);
});

socket.on('connection', (data) => {
  console.log('연결 성공, UUID 수신:', data);
  userId = data.uuid;
});

socket.on('gameData', (data) => {
  console.log('게임 에셋 수신:', data);
  gameAssets = data;
  if (onAssetsLoadedCallback) {
    onAssetsLoadedCallback(data);
  }
});

socket.on('broadcast', (data) => {
  if (data.type === 'BROADCAST_MESSAGE') {
    console.log(`[브로드캐스트] ${data.payload.message}`);
  } else if (data.type === 'HIGH_SCORE_UPDATE' && scoreUpdateCallback) {
    scoreUpdateCallback(data.score);
  }
});

socket.on('highScoreUser', (data) => {
  console.log(`🏆 [하이스코어 보유자] ${data.message}`);
});

const sendEvent = (handlerId, payload) => {
  console.log('이벤트 전송:', {
    handlerId,
    payload,
  });

  socket.emit('event', {
    clientVersion: CLIENT_VERSION,
    handlerId,
    payload,
  });
};

const setOnAssetsLoaded = (callback) => {
  onAssetsLoadedCallback = callback;
  if (gameAssets) {
    callback(gameAssets);
  }
};

const getGameAssets = () => gameAssets;

const loadGameAssets = () => {
  return new Promise((resolve) => {
    if (gameAssets) {
      resolve(gameAssets);
      return;
    }

    socket.on('gameData', (data) => {
      gameAssets = data;
      resolve(data);
    });
  });
};

export const registerScoreHandler = (callback) => {
  scoreUpdateCallback = callback;
};

export { sendEvent, getGameAssets, setOnAssetsLoaded, loadGameAssets };
