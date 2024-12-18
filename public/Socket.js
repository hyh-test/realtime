import { CLIENT_VERSION } from './Constants.js';

// UUID를 로컬 스토리지에 저장하기 위한 키값
const STORAGE_KEY = 'game_uuid';
// 페이지 로드 시 저장된 UUID가 있다면 가져옴
let uuid = localStorage.getItem(STORAGE_KEY);
let gameAssets = null;
let onAssetsLoadedCallback = null;
let scoreUpdateCallback = null;

// 소켓 연결 시 클라이언트 버전과 함께 저장된 UUID도 서버로 전송
const socket = io('http://localhost:3000', {
  query: {
    clientVersion: CLIENT_VERSION,
    uuid: uuid,
  },
});

socket.on('response', (data) => {
  console.log('서버 응답:', data);
});

// 서버로부터 연결 응답을 받으면
socket.on('connection', (data) => {
  console.log('연결 성공, UUID 수신:', data.status);
  if (data.uuid) {
    uuid = data.uuid;
    // 서버에서 받은 UUID를 로컬 스토리지에 저장하여 다음 접속 시에도 사용
    localStorage.setItem(STORAGE_KEY, uuid);
  } else {
    console.error('서버에서 유효한 UUID를 받지 못했습니다');
  }
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
  if (!uuid) {
    uuid = localStorage.getItem(STORAGE_KEY);
    console.warn('UUID 재확인 필요:', uuid);
  }

  if (!uuid || uuid === 'null') {
    console.error('유효하지 않은 UUID로 이벤트 전송 시도');
    return;
  }

  const eventData = {
    clientVersion: CLIENT_VERSION,
    handlerId,
    uuid,
    payload,
  };

  console.log('이벤트 전송:', eventData.handlerId, eventData.payload);
  socket.emit('event', eventData);
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

// UUID를 외부에서 가져갈 수 있도록 getter 추가
const getUUID = () => uuid;

const hasValidUUID = () => {
  return uuid && uuid !== 'null';
};

export { sendEvent, getGameAssets, setOnAssetsLoaded, loadGameAssets, getUUID, hasValidUUID };
