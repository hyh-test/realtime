import { v4 as uuidv4 } from 'uuid';
import { addUser } from '../models/user.model.js';
import { handleConnection, handleDisconnect, handleEvent } from './helper.js';
import { getGameAssets } from '../init/assets.js';

const registerHandler = (io) => {
  io.on('connection', (socket) => {
    const userUUID = uuidv4();
    addUser({ uuid: userUUID, socketId: socket.id });

    // 게임 에셋 데이터를 클라이언트로 전송
    const gameAssets = getGameAssets();
    socket.emit('gameAssets', gameAssets);
    
    handleConnection(socket, userUUID);
    socket.on('event', (data) => handleEvent(io, socket, data));
    socket.on('disconnect', () => handleDisconnect(socket, userUUID));
  });
};

export default registerHandler;