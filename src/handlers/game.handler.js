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

  if (!stages.length) {
    return { status: 'fail', message: '사용자의 스테이지 정보를 찾을 수 없습니다' };
  }

  // 스테이지 지속 시간 기반 점수 계산
  stages.forEach((stage, index) => {
    const currentStageData = stageData.data.find((s) => s.id === stage.id);

    let stageEndTime;
    if (index === stages.length - 1) {
      stageEndTime = gameEndTime;
    } else {
      stageEndTime = stages[index + 1].timestamp;
    }
    const stageDuration = (stageEndTime - stage.timestamp) / 1000;
    serverScore += stageDuration * currentStageData.scorePerSecond;
  });

  // 최종 점수 검증
  if (Math.abs(clientScore - serverScore) > 5) {
    console.log(`점수 불일치 - 클라이언트: ${clientScore}, 서버: ${serverScore}`);
    return {
      status: 'fail',
      message: '점수 검증 실패',
      details: {
        clientScore,
        serverScore,
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
    },
  };
};
