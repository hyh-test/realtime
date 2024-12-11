import { getGameAssets } from '../init/assets.js';
import { getUser, removeUser } from '../models/user.model.js';
import { cilent_version } from '../constants.js';

export const handleDisconnect = (socket, uuid) => {
  removeUser(socket.id);
  console.log(`User disconnected: ${socket.id}`);
  console.log(`Current users :`, getUser());
};

export const handleConnection = (socket, uuid) => {
  console.log(`New user onnected! : ${uuid} with socket ID ${socket.id}`);
  console.log(`Current users:`, getUser());

 

  socket.emit(`connection`, { uuid });
};

export const handlerEvent = (io, socket, data) => {
  if (!cilent_version.includes(data.cilentVersion)) {
    socket.emit('response', { status: 'fail' });
    return;
  }

  const handler = handerMappings[data.handlerId];
  if (!handler) {
    socket.emit('response', { status: 'fail', message: 'Handler not found' });
    return;
  }
  const response = handler(data.userId, data.payload);

  if (response.broadcast) {
    io.emit('response', 'broadcast');
    return;
  }

  socket.emit('response', response);
};
