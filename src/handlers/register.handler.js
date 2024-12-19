import { v4 as uuidv4 } from 'uuid';
import { addUser } from '../models/user.model.js';
import { handleConnection, handleDisconnect, handleEvent } from './helper.js';
import { getGameAssets } from '../init/assets.js';
import { getGlobalHighScore, getLastHighScoreHolder } from './game.handler.js';

const registerHandler = (io) => {
  // 소켓 연결 이벤트 처리
  io.on('connection', (socket) => {
    let clientId = socket.handshake.query.uuid; // 클라이언트에서 전달된 UUID 가져오기

    // clientId가 'null' 문자열이거나 undefined인 경우 새 UUID 생성
    if (!clientId || clientId === 'null') {
      clientId = uuidv4(); // 새로운 UUID 생성
      console.log('새 UUID 생성:', clientId); // 생성된 UUID 로그
    } else {
      console.log('기존 UUID 사용:', clientId); // 기존 UUID 사용 로그
    }

    const userUUID = clientId; // 사용자 UUID 설정
    console.log('사용자 연결:', {
      socketId: socket.id, // 소켓 ID
      uuid: userUUID, // 사용자 UUID
    });

    // 사용자 정보 저장
    addUser({ uuid: userUUID, socketId: socket.id }); // 사용자 정보를 데이터베이스에 추가

    const gameAssets = getGameAssets(); // 게임 자산 가져오기
    const globalHighScore = getGlobalHighScore(); // 전역 하이스코어 가져오기
    const highScoreHolder = getLastHighScoreHolder(); // 마지막 하이스코어 보유자 정보 가져오기

    // 클라이언트에 UUID 전달
    socket.emit('connection', {
      uuid: userUUID, // 클라이언트에 UUID 전송
      status: 'connected', // 연결 상태 전송
    });

    // 게임 데이터 전송
    socket.emit('gameData', {
      ...gameAssets, // 게임 자산 전송
      globalHighScore, // 전역 하이스코어 전송
    });

    // 하이스코어 보유자일 경우 추가 정보 전송
    if (highScoreHolder && highScoreHolder.uuid === userUUID) {
      console.log('하이스코어 보유자 접속:', {
        uuid: userUUID, // 하이스코어 보유자 UUID
        score: globalHighScore, // 하이스코어
      });

      socket.emit('highScoreUser', {
        message: `현재 최고 점수 ${globalHighScore}점의 보유자입니다!`, // 하이스코어 보유자 메시지
        score: globalHighScore, // 하이스코어
        timestamp: highScoreHolder.timestamp, // 하이스코어 보유자 타임스탬프
      });
    }

    // 연결 처리 함수 호출
    handleConnection(socket, userUUID);
    // 이벤트 수신 시 처리
    socket.on('event', (data) => handleEvent(io, socket, { ...data, userId: userUUID }));
    // 연결 해제 시 처리
    socket.on('disconnect', () => handleDisconnect(socket, userUUID));
  });
};

export default registerHandler; // registerHandler 함수를 기본 내보내기
