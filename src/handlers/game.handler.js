import { getGameAssets } from '../init/assets.js';
import { getStage, setStage, clearStage } from '../models/stage.model.js';

let globalHighScore = 0;
let lastHighScoreHolder = null;

// 전역 최고 점수 가져오는 함수 추가
export const getGlobalHighScore = () => {
  return globalHighScore;
};

export const getLastHighScoreHolder = () => lastHighScoreHolder;

// 게임 시작 처리 함수
export const gameStart = (uuid, payload) => {
  // 게임 에셋에서 스테이지 정보 가져오기
  const { stages } = getGameAssets();

  // 해당 사용자의 이전 스테이지 정보 초기화
  clearStage(uuid);

  // 첫 번째 스테이지(id: 1)로 설정하고 시작 시간 기록
  setStage(uuid, stages.data[0].id, payload.timestamp);

  // 설정된 스테이지 정보 로깅
  console.log('Stage:', getStage(uuid));

  return { status: 'success' };
};

// 게임 종료 처리 함수
export const gameEnd = (uuid, payload) => {
  // 클라이언트에서 전송된 게임 종료 데이터 추출
  const { timestamp: gameEndTime, score: clientScore, itemScores } = payload;

  // 서버에 저장된 사용자의 스테이지 진행 기록 조회
  const stages = getStage(uuid);

  // 게임 에셋에서 스테이지와 아이템 데이터 가져오기
  const { stages: stageData, items: itemData } = getGameAssets();

  // 서버 측 점수 계산을 위한 변수 초기화
  let serverScore = 0;
  let itemTotalScore = 0;

  // 스테이지 정보가 없는 경우 에러 반환
  if (!stages.length) {
    return { status: 'fail', message: '사용자의 스테이지 정보를 찾을 수 없습니다' };
  }

  // 아이템 획득 점수 검증
  if (itemScores) {
    // 각 아이템별 점수 계산
    for (const [itemId, count] of Object.entries(itemScores)) {
      // 아이템 정보 조회
      const item = itemData.data.find((i) => i.id === parseInt(itemId));

      // 존재하지 않는 아이템인 경우 에러 반환
      if (!item) {
        return {
          status: 'fail',
          message: '존재하지 않는 아이템입니다',
          itemId,
        };
      }
      // 아이템 점수 = 아이템 기본 점수 × 획득 개수
      itemTotalScore += item.score * count;
    }
  }

  // 스테이지별 기본 점수 계산
  stages.forEach((stage, index) => {
    // 현재 스테이지 정보 조회
    const currentStageData = stageData.data.find((s) => s.id === stage.id);

    // 스테이지 종료 시간 계산
    // 마지막 스테이지면 게임 종료 시간, 아니면 다음 스테이지 시작 시간
    let stageEndTime = index === stages.length - 1 ? gameEndTime : stages[index + 1].timestamp;

    // 스테이지 진행 시간(초) 계산
    const stageDuration = (stageEndTime - stage.timestamp) / 1000;

    // 스테이지 점수 = 진행 시간 × 초당 점수
    serverScore += stageDuration * currentStageData.scorePerSecond;
  });

  // 최종 서버 점수에 아이템 점수 추가
  serverScore += itemTotalScore;

  // 클라이언트 점수와 서버 점수 비교 검증
  // 오차 범위가 5점을 초과하면 부정행위로 간주
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

  // 모든 검증이 통과되면 최종 결과 반환
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
// 브로드캐스트로 console.log로 메세지를 전달
export const broadcastMessage = (userId, payload) => {
  // 서버 콘솔에 메시지 출력
  console.log(`[브로드캐스트] ${payload.message}`);

  //브로드캐스트에 들어가는 데이터들
  return {
    broadcast: true,
    type: 'BROADCAST_MESSAGE',
    payload: {
      message: payload.message,
      sender: userId,
      timestamp: Date.now(),
    },
  };
};

export const updateHighScore = (userId, payload) => {
  const newScore = payload.score;
  console.log('새로운 하이스코어 업데이트 시도:', { userId, newScore, currentHighScore: globalHighScore });

  if (newScore > globalHighScore) {
    globalHighScore = newScore;
    lastHighScoreHolder = {
      uuid: userId,
      score: newScore,
      timestamp: Date.now()
    };
    
    console.log('하이스코어 홀더 업데이트:', lastHighScoreHolder);

    return {
      broadcast: true,
      type: 'HIGH_SCORE_UPDATE',
      score: globalHighScore,
      holder: lastHighScoreHolder
    };
  }
  return null;
};
