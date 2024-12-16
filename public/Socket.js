import { CLIENT_VERSION } from './Constants.js';

const socket = io('http://localhost:3000', {
  query: {
    clientVersion: CLIENT_VERSION,
  },
});

let userId = null;
let gameAssets = null;

socket.on('response', (data) => {
  console.log('서버 응답:', data);
});

socket.on('connection', (data) => {
  console.log('연결 성공, UUID 수신:', data);
  userId = data.uuid;
});

socket.on('gameAssets', (data) => {
  console.log('게임 에셋 수신:', data);
  gameAssets = data;
  // Score 클래스에 에셋 데이터 전달
  if (window.gameScore) {
    window.gameScore.setGameAssets(data);
  }
});

const sendEvent = (handlerId, payload) => {
  console.log('이벤트 전송:', {
    handlerId,
    payload,
    userId,
  });

  socket.emit('event', {
    userId,
    clientVersion: CLIENT_VERSION,
    handlerId,
    payload,
  });
};

const getGameAssets = () => gameAssets;

export { sendEvent, getGameAssets };
