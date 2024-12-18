import { v4 as uuidv4 } from 'uuid';
import { addUser } from '../models/user.model.js';
import { handleConnection, handleDisconnect, handleEvent } from './helper.js';
import { getGameAssets } from '../init/assets.js';
import { getGlobalHighScore, getLastHighScoreHolder } from './game.handler.js';

const registerHandler = (io) => {
  io.on('connection', (socket) => {
    let clientId = socket.handshake.query.uuid;

    // clientId가 'null' 문자열이거나 undefined인 경우 새 UUID 생성
    if (!clientId || clientId === 'null') {
      clientId = uuidv4();
      console.log('새 UUID 생성:', clientId);
    } else {
      console.log('기존 UUID 사용:', clientId);
    }

    const userUUID = clientId;
    console.log('사용자 연결:', {
      socketId: socket.id,
      uuid: userUUID,
    });

    // 사용자 정보 저장
    addUser({ uuid: userUUID, socketId: socket.id });

    const gameAssets = getGameAssets();
    const globalHighScore = getGlobalHighScore();
    const highScoreHolder = getLastHighScoreHolder();

    // 클라이언트에 UUID 전달
    socket.emit('connection', {
      uuid: userUUID,
      status: 'connected',
    });

    // 게임 데이터 전송
    socket.emit('gameData', {
      ...gameAssets,
      globalHighScore,
    });

    if (highScoreHolder && highScoreHolder.uuid === userUUID) {
      console.log('하이스코어 보유자 접속:', {
        uuid: userUUID,
        score: globalHighScore,
      });

      socket.emit('highScoreUser', {
        message: `현재 최고 점수 ${globalHighScore}점의 보유자입니다!`,
        score: globalHighScore,
        timestamp: highScoreHolder.timestamp,
      });
    }

    handleConnection(socket, userUUID);
    socket.on('event', (data) => handleEvent(io, socket, { ...data, userId: userUUID }));
    socket.on('disconnect', () => handleDisconnect(socket, userUUID));
  });
};

export default registerHandler;
