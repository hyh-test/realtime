import { getStage, setStage } from '../models/stage.model.js';
import { getGameAssets } from '../init/assets.js';

export const moveStageHandler = (userId, payload) => {
  // 유저의 현재 스테이지 배열을 가져오고, 최대 스테이지 ID를 찾는다.
  const { stages } = getGameAssets();

  let currentStages = getStage(userId);
  console.log('Current Stages:', currentStages);
  if (!currentStages.length) {
    const { stages } = getGameAssets();
    console.log(`Stages for user ${uuid}:`, stages);
    setStage(userId, 1000, Date.now()); // 초기 스테이지 1000으로 설정
    currentStages = getStage(userId);
    return { status: 'fail', message: 'No stages found for user' };
  }

  // 오름차순 정렬 후 가장 큰 스테이지 ID 확인 = 가장 상위의 스테이지 = 현재 스테이지
  currentStages.sort((a, b) => a.id - b.id);
  const currentStage = currentStages[currentStages.length - 1];

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

  // 1초당 1점, 10점이상 다음스테이지 이동, 오차범위 5
  // 클라이언트와 서버 간의 통신 지연시간을 고려해서 오차범위 설정
  // elapsedTime 은 10 이상 10.5 이하 일 경우만 통과
  console.log('Elapsed Time:', elapsedTime);
  if (elapsedTime < payload.targetStage.score - 1 || elapsedTime > payload.targetStage.score + 3) {
    return { status: 'fail', message: 'Invalid elapsed time' };
  }

  // 게임 에셋에서 다음 스테이지의 존재 여부 확인
  if (!stages.data.some((stage) => stage.id === payload.targetStage)) {
    return { status: 'fail', message: 'Target stage does not exist' };
  }

  // 유저의 다음 스테이지 정보 업데이트 + 현재 시간
  setStage(userId, payload.targetStage, serverTime); // targetStage.id 대신 targetStage 사용
  return { status: 'success' };
};
