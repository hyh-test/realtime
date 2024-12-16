import { getStage, setStage } from '../models/stage.model.js';
import { getGameAssets } from '../init/assets.js';

export const moveStageHandler = (userId, payload) => {
  // 유저의 현재 스테이지 배열을 가져오고, 최대 스테이지 ID를 찾는다.
  const { stages } = getGameAssets();

  let currentStages = getStage(userId);

  if (!currentStages.length) {
    const { stages } = getGameAssets();
    console.log('초기 스테이지 설정:', {
      userId: userId,
      stageId: 1000,
      timestamp: Date.now(),
    });
    setStage(userId, 1000, Date.now());
    currentStages = getStage(userId);
    return { status: 'fail', message: 'No stages found for user' };
  }

  // 오름차순 정렬 후 가장 큰 스테이지 ID 확인 = 가장 상위의 스테이지 = 현재 스테이지
  currentStages.sort((a, b) => a.id - b.id);
  const currentStage = currentStages[currentStages.length - 1];
  console.log('현재 스테이지 정보:', {
    currentStageId: currentStage.id,
    timestamp: currentStage.timestamp,
    targetStage: payload.targetStage,
  });

  // payload 의 currentStage 와 비교
  if (currentStage.id !== payload.currentStage) {
    return {
      status: 'fail',
      message: `Current stage mismatch ${payload.currentStage} ${currentStage.id}`,
    };
  }

  // 점수 검증
  const serverTime = Date.now();
  const elapsedTime = (serverTime - currentStage.timestamp) / 1000; // 초 단위로 계산

  console.log('Elapsed Time:', elapsedTime);
  if (elapsedTime < payload.targetStage.score - 1 || elapsedTime > payload.targetStage.score + 3) {
    return { status: 'fail', message: 'Invalid elapsed time' };
  }

  // 게임 에셋에서 다음 스테이지의 존재 여부 확인
  if (!stages.data.some((stage) => stage.id === payload.targetStage)) {
    return { status: 'fail', message: 'Target stage does not exist' };
  }

  // 유저의 다음 스테이지 정보 업데이트 + 현재 시간
  setStage(userId, payload.targetStage, serverTime);
  return { status: 'success' };
};
