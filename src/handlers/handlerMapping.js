import { moveStageHandler } from './stage.handler.js';
import { gameEnd, gameStart, broadcastMessage, updateHighScore } from './game.handler.js';

const handlerMappings = {
  2: gameStart,
  3: gameEnd,
  11: moveStageHandler,
  12: broadcastMessage,
  13: updateHighScore,
};

export default handlerMappings;
