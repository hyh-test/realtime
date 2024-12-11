//유저는 스테이지를 하나씩 올라갈수 있다.
//유저는 일정 점수가 되면 다음 스테이지로 이동한다.
import { getGameAssets } from '../init/assets';
import { getStage, setStage } from '../models/stage.model.js';

export const moveStageHandler = (userId, payload) => {
  //현재 스테이지 정보
  let currentStages = getStage(userId);
  if (!currentStages.length) {
    return { status: 'fail', message: 'No stages found for user' };
  }
  //오름차순 가장 큰 스테이지 id 확인
  currentStages.sort((a, b) => a.id - b.id);
  const currentStageId = currentStages[currentStages.length - 1].id;

  //클라이언트와 서비 비교
  if (currentStageId !== payload.currentStage) {
    return { status: 'fail', message: 'Current stage mismatch' };
  }

  //targetStage 검증 게임 에셋에 존재하는가
  const { stages } = getGameAssets();
  if (!stages.data.some((stage) => stage.id === payload.targetStage)) {
    return { status: 'fail', message: 'Target stage not found' };
  }

  setStage(userId, payload, targetStage);

  return { status: 'success' };
};
