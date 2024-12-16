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
  const { timestamp: gameEndTime, score, itemScores } = payload;
  const stages = getStage(uuid);
  const { stages: stageData } = getGameAssets();

  if (!stages.length) {
    return { status: 'fail', message: '사용자의 스테이지 정보를 찾을 수 없습니다' };
  }

  // 스테이지 지속 시간 기반 점수 계산
  let totalScore = 0;
  stages.forEach((stage, index) => {
    const currentStageData = stageData.data.find((s) => s.id === stage.id);

    let stageEndTime;
    if (index === stages.length - 1) {
      stageEndTime = gameEndTime;
    } else {
      stageEndTime = stages[index + 1].timestamp;
    }
    const stageDuration = (stageEndTime - stage.timestamp) / 1000;
    totalScore += stageDuration * currentStageData.scorePerSecond;
  });

  console.log('스테이지 기반 점수:', totalScore);

  // 아이템 점수 추가
  if (itemScores && Array.isArray(itemScores)) {
    console.log('받은 아이템 점수 데이터:', itemScores);
    const itemScore = itemScores.reduce((sum, item) => {
      console.log('현재 처리중인 아이템:', item);
      return sum + (item.score || 0);
    }, 0);
    console.log('계산된 총 아이템 점수:', itemScore);
    totalScore += itemScore;
  }

  console.log('최종 총 점수:', totalScore);
  console.log('클라이언트에서 받은 점수:', score);

  // 점수 검증
  if (Math.abs(score - totalScore) > 5) {
    return { 
      status: 'fail', 
      message: '점수 검증 실패',
      debug: {
        calculatedScore: totalScore,
        receivedScore: score,
        difference: Math.abs(score - totalScore)
      }
    };
  }

  return { status: 'success', message: '게임이 성공적으로 종료되었습니다', score };
};
