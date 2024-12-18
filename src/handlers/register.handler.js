import { v4 as uuidv4 } from 'uuid';
import { addUser } from '../models/user.model.js';
import { handleConnection, handleDisconnect, handleEvent } from './helper.js';
import { getGameAssets } from '../init/assets.js';
import { getGlobalHighScore, getLastHighScoreHolder } from './game.handler.js';

const registerHandler = (io) => {
  io.on('connection', (socket) => {
    const userUUID = uuidv4();
    addUser({ uuid: userUUID, socketId: socket.id });

    const gameAssets = getGameAssets();
    const globalHighScore = getGlobalHighScore();
    const highScoreHolder = getLastHighScoreHolder();

    // 게임 데이터 전송
    socket.emit('gameData', {
      ...gameAssets,
      globalHighScore,
    });

    // 하이스코어 보유자 체크 및 메시지 전송
    console.log('접속한 유저 확인:', { 
      userUUID, 
      highScoreHolder: highScoreHolder?.uuid,
      globalHighScore 
    });

    if (highScoreHolder && highScoreHolder.uuid === userUUID) {
      console.log('하이스코어 보유자 접속:', userUUID);
      socket.emit('highScoreUser', {
        message: `현재 최고 점수 ${globalHighScore}점의 보유자입니다!`,
        score: globalHighScore
      });
    }

    handleConnection(socket, userUUID);
    socket.on('event', (data) => handleEvent(io, socket, data));
    socket.on('disconnect', () => handleDisconnect(socket, userUUID));
  });
};

export default registerHandler;
