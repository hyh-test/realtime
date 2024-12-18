import { v4 as uuidv4 } from 'uuid';
import { addUser } from '../models/user.model.js';
import { handleConnection, handleDisconnect, handleEvent } from './helper.js';
import { getGameAssets } from '../init/assets.js';
import { getGlobalHighScore } from './game.handler.js';

const registerHandler = (io) => {
  io.on('connection', (socket) => {
    const userUUID = uuidv4();
    addUser({ uuid: userUUID, socketId: socket.id });

    // 게임 에셋과 함께 전역 최고 점수도 전송
    const gameAssets = getGameAssets();
    const globalHighScore = getGlobalHighScore();

    socket.emit('gameData', {
      ...gameAssets,
      globalHighScore,
    });

    handleConnection(socket, userUUID);
    socket.on('event', (data) => handleEvent(io, socket, data));
    socket.on('disconnect', () => handleDisconnect(socket, userUUID));
  });
};

export default registerHandler;
