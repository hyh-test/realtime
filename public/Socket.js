import { CLIENT_VERSION } from './Constants.js';

// UUID를 로컬 스토리지에 저장하기 위한 키값
const STORAGE_KEY = 'game_uuid';
// 페이지 로드 시 저장된 UUID가 있다면 가져옴
let uuid = localStorage.getItem(STORAGE_KEY);
let gameAssets = null; // 게임 자산을 저장할 변수
let onAssetsLoadedCallback = null; // 자산 로드 완료 콜백
let scoreUpdateCallback = null; // 점수 업데이트 콜백

// 소켓 연결 시 클라이언트 버전과 함께 저장된 UUID도 서버로 전송npm install socket.io-redis
const socket = io('http://localhost:3000', {
  query: {
    clientVersion: CLIENT_VERSION, // 클라이언트 버전
    uuid: uuid, // UUID
  },
});

// 서버로부터 응답을 받았을 때
socket.on('response', (data) => {
  console.log('서버 응답:', data); // 서버 응답 로그
});

// 서버로부터 연결 응답을 받으면
socket.on('connection', (data) => {
  console.log('연결 성공, UUID 수신:', data.status); // 연결 성공 로그
  if (data.uuid) {
    uuid = data.uuid; // 서버에서 받은 UUID 저장
    // 서버에서 받은 UUID를 로컬 스토리지에 저장하여 다음 접속 시에도 사용
    localStorage.setItem(STORAGE_KEY, uuid);
  } else {
    console.error('서버에서 유효한 UUID를 받지 못했습니다'); // UUID 오류 로그
  }
});

// 게임 데이터 수신
socket.on('gameData', (data) => {
  console.log('게임 에셋 수신:', data); // 게임 자산 수신 로그
  gameAssets = data; // 게임 자산 저장
  if (onAssetsLoadedCallback) {
    onAssetsLoadedCallback(data); // 자산 로드 완료 콜백 호출
  }
});

// 브로드캐스트 메시지 수신
socket.on('broadcast', (data) => {
  if (data.type === 'BROADCAST_MESSAGE') {
    console.log(`[브로드캐스트] ${data.payload.message}`); // 브로드캐스트 메시지 로그
  } else if (data.type === 'HIGH_SCORE_UPDATE' && scoreUpdateCallback) {
    scoreUpdateCallback(data.score); // 하이스코어 업데이트 콜백 호출
  }
});

// 하이스코어 보유자 정보 수신
socket.on('highScoreUser', (data) => {
  console.log(`🏆 [하이스코어 보유자] ${data.message}`); // 하이스코어 보유자 로그
});

// 이벤트 전송 함수
const sendEvent = (handlerId, payload) => {
  if (!uuid) {
    uuid = localStorage.getItem(STORAGE_KEY); // UUID 재확인
    console.warn('UUID 재확인 필요:', uuid);
  }

  if (!uuid || uuid === 'null') {
    console.error('유효하지 않은 UUID로 이벤트 전송 시도'); // 유효하지 않은 UUID 오류 로그
    return;
  }

  const eventData = {
    clientVersion: CLIENT_VERSION, // 클라이언트 버전
    handlerId, // 이벤트 핸들러 ID
    uuid, // UUID
    payload, // 이벤트 페이로드
  };

  console.log('이벤트 전송:', eventData.handlerId, eventData.payload); // 이벤트 전송 로그
  socket.emit('event', eventData); // 이벤트 전송
};

// 자산 로드 완료 콜백 설정 함수
const setOnAssetsLoaded = (callback) => {
  onAssetsLoadedCallback = callback; // 콜백 저장
  if (gameAssets) {
    callback(gameAssets); // 이미 로드된 자산이 있다면 즉시 호출
  }
};

// 게임 자산 가져오기 함수
const getGameAssets = () => gameAssets; // 게임 자산 반환

// 게임 자산 로드 함수
const loadGameAssets = () => {
  return new Promise((resolve) => {
    if (gameAssets) {
      resolve(gameAssets); // 이미 로드된 자산이 있다면 반환
      return;
    }

    // 게임 데이터 수신 시 자산 저장 및 반환
    socket.on('gameData', (data) => {
      gameAssets = data; // 게임 자산 저장
      resolve(data); // 자산 반환
    });
  });
};

// 점수 업데이트 핸들러 등록 함수
export const registerScoreHandler = (callback) => {
  scoreUpdateCallback = callback; // 콜백 저장
};

// UUID를 외부에서 가져갈 수 있도록 getter 추가
const getUUID = () => uuid; // UUID 반환

// 유효한 UUID 확인 함수
const hasValidUUID = () => {
  return uuid && uuid !== 'null'; // UUID가 유효한지 확인
};

// 필요한 함수 및 변수를 외부로 내보내기
export { sendEvent, getGameAssets, setOnAssetsLoaded, loadGameAssets, getUUID, hasValidUUID };
