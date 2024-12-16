import { getGameAssets } from '../init/assets.js';
import { getStage, setStage, clearStage } from '../models/stage.model.js';

export const gameStart = (uuid, payload) => {
  const { stages } = getGameAssets();

  clearStage(uuid);
  setStage(uuid, stages.data[0].id, payload.timestamp);
  console.log('Stage:', getStage(uuid));

  return { status: 'success' };
};

export const gameEnd = (uuid, payload) => {
  const { timestamp: gameEndTime, score: clientScore, itemScores } = payload;
  const stages = getStage(uuid);
  const { stages: stageData, items: itemData } = getGameAssets();
  let serverScore = 0;
  let itemTotalScore = 0;

  if (!stages.length) {
    return { status: 'fail', message: '사용자의 스테이지 정보를 찾을 수 없습니다' };
  }

  // 아이템 점수 검증
  if (itemScores) {
    for (const [itemId, count] of Object.entries(itemScores)) {
      const item = itemData.data.find((i) => i.id === parseInt(itemId));
      if (!item) {
        return {
          status: 'fail',
          message: '존재하지 않는 아이템입니다',
          itemId,
        };
      }
      itemTotalScore += item.score * count;
    }
  }

  // 스테이지 점수 계산
  stages.forEach((stage, index) => {
    const currentStageData = stageData.data.find((s) => s.id === stage.id);
    let stageEndTime = index === stages.length - 1 ? gameEndTime : stages[index + 1].timestamp;
    const stageDuration = (stageEndTime - stage.timestamp) / 1000;
    serverScore += stageDuration * currentStageData.scorePerSecond;
  });

  // 아이템 점수를 서버 점수에 추가
  serverScore += itemTotalScore;

  // 최종 점수 검증
  if (Math.abs(clientScore - serverScore) > 5) {
    console.log(`점수 불일치 - 클라이언트: ${clientScore}, 서버: ${serverScore}`);
    return {
      status: 'fail',
      message: '점수 검증 실패',
      details: {
        clientScore,
        serverScore,
        itemScores,
        difference: Math.abs(clientScore - serverScore),
      },
    };
  }

  return {
    status: 'success',
    message: '게임이 성공적으로 종료되었습니다',
    score: serverScore,
    details: {
      clientScore,
      serverScore,
      itemTotalScore,
      itemScores,
    },
  };
};
