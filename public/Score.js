import { sendEvent, getGameAssets, setOnAssetsLoaded, registerScoreHandler } from './Socket.js';

class Score {
  // 게임 내 현재 점수를 저장하는 변수
  score = 0;
  // 다음 스테이지로 변경이 가능한지 나타내는 플래그
  stageChange = true;
  // 현재 플레이 중인 스테이지의 고유 ID
  currentStageId = null;
  // 서버에서 받아온 전체 스테이지 정보를 저장하는 객체
  stageData = null;
  // 서버에서 받아온 전체 아이템 정보를 저장하는 객체
  itemData = null;
  // 각 스테이지별로 사용 가능한 아이템 정보를 저장하는 객체
  itemUnlockData = null;
  // 플레이어가 획득한 아이템별 횟수를 기록하는 객체
  itemScores = {};
  // 서버의 전역 최고 점수를 저장할 변수
  globalHighScore = 0;

  constructor(ctx, scaleRatio) {
    // 캔버스 2D 렌더링 컨텍스트 저장
    this.ctx = ctx;
    // 캔버스 엘리먼트 참조 저장
    this.canvas = ctx.canvas;
    // 화면 크기에 따른 UI 요소 크기 조정을 위한 비율
    this.scaleRatio = scaleRatio;
    this.score = 0;
    this.globalHighScore = 0;

    // Socket.js에서 사용할 수 있도록 이벤트 리스너 등록
    this.registerSocketListeners();

    const assets = getGameAssets();
    if (assets) {
      this.setGameAssets(assets);
    } else {
      setOnAssetsLoaded((assets) => {
        this.setGameAssets(assets);
      });
    }
  }

  registerSocketListeners() {
    // Socket.js에 Score 인스턴스의 updateHighScore 메서드 전달
    registerScoreHandler((score) => {
      this.updateHighScore(score);
    });
  }

  // 게임 에셋 설정 메서드
  setGameAssets(assets) {
    if (!assets) {
      console.error('assets가 없습니다');
      return;
    }

    this.stageData = assets.stages;
    this.itemData = assets.items;
    this.itemUnlockData = assets.itemUnlocks;

    if (assets.globalHighScore) {
      this.globalHighScore = assets.globalHighScore;
    }

    //현재 스테이지 배열0의 값을 현재 스테이지 id로 설정
    if (this.stageData && this.stageData.data.length > 0) {
      this.currentStageId = this.stageData.data[0].id;
    }
  }

  // 점수와 스테이지 업데이트
  update(deltaTime) {
    if (!this.stageData) return;

    // 현재 스테이지 정보를 스테이지 데이터에서 검색
    const currentStage = this.stageData.data.find((stage) => stage.id === this.currentStageId);
    if (!currentStage) return;

    // 현재 점수에 적합한 스테이지를 찾음
    // 현재 점수보다 낮은 점수 요구치를 가진 스테이지 중 가장 높은 것을 선택
    const appropriateStage = this.stageData.data.reduce((prev, curr) => {
      if (this.score >= curr.score) return curr;
      return prev;
    });

    // 1초당 currentStage.scorePerSecond 만큼 점수 증가
    this.score += deltaTime * currentStage.scorePerSecond * 0.001;

    // 스테이지 변경 조건 충족 시 처리
    if (appropriateStage.id !== this.currentStageId && this.stageChange) {
      this.stageChange = false;
      const previousStageId = this.currentStageId;
      this.currentStageId = appropriateStage.id;

      // 서버에 스테이지 변경 이벤트 전송 (이벤트 타입 11)
      sendEvent(11, {
        currentStage: previousStageId,
        targetStage: this.currentStageId,
      });
    }

    // 다음 스테이지 변경 가능 여부 확인
    // 다음 스테이지가 존재하고 현재 점수가 다음 스테이지 요구 점수보다 낮을 때만 변경 가능
    const nextStage = this.stageData.data.find((stage) => stage.id === appropriateStage.id + 1);
    this.stageChange = nextStage ? Math.floor(this.score) < nextStage.score : false;
  }

  // 현재 스테이지에서 아이템 사용 가능 여부 확인
  isItemAvailableInCurrentStage(itemId) {
    if (!this.itemUnlockData || !this.itemUnlockData.data) return false;

    const currentStageUnlock = this.itemUnlockData.data.find(
      (unlock) => unlock.stage_id === this.currentStageId,
    );

    return currentStageUnlock && currentStageUnlock.item_id.includes(itemId);
  }

  // 아이템 획득 처리
  getItem(itemId) {
    if (!this.itemData?.data) {
      console.warn('아이템 데이터가 없습니다');
      return;
    }

    const item = this.itemData.data.find((item) => item.id === itemId);
    if (!item) {
      console.log(`Item with ID ${itemId} not found.`);
      return;
    }

    // 아이템 점수 추가 및 기록
    this.score += item.score;
    if (!this.itemScores[itemId]) {
      this.itemScores[itemId] = 0;
    }
    this.itemScores[itemId]++;

    console.log(`Item collected: +${item.score} points`);
  }

  // 아이템별 획득 점수 반환
  getItemScores() {
    return this.itemScores;
  }

  // 점수 초기화
  reset() {
    this.score = 0;
    this.itemScores = {};
    if (this.stageData && this.stageData.data.length > 0) {
      this.currentStageId = this.stageData.data[0].id;
    }
    this.stageChange = true;

    console.log('Score 리셋됨:', {
      score: this.score,
      itemScores: this.itemScores,
    });
  }

  // 최고 점수 설정
  setHighScore() {
    const currentScore = Math.floor(this.score);

    if (currentScore > this.globalHighScore) {
      this.globalHighScore = currentScore;

      console.log('🎮 새로운 하이스코어 달성!', {
        score: currentScore,
        previousHighScore: this.globalHighScore
      });

      sendEvent(13, {
        score: currentScore,
        previousHighScore: this.globalHighScore,
        timestamp: Date.now(),
      });

      this.sendBroadcast(`🎮 새로운 최고 점수! ${currentScore}점을 달성했습니다!`);
    }
  }

  // 서버로부터 다른 플레이어의 최고 점수 업데이트 받기
  updateHighScore(newScore) {
    if (newScore > this.globalHighScore) {
      this.globalHighScore = newScore;
      console.log(`서버에서 새로운 최고 점수 수신: ${newScore}`);
    }
  }

  // 현재 점수 반환
  getScore() {
    return this.score;
  }

  // 브로드캐스트 메시지 보내기
  sendBroadcast(message) {
    sendEvent(12, {
      message: message,
    });
  }

  // 화면에 점수 표시
  draw() {
    if (!this.stageData) return;

    // UI 요소들의 수직 위치
    const y = 20 * this.scaleRatio;
    // 폰트 크기 설정 (화면 크기에 비례)
    const fontSize = 20 * this.scaleRatio;

    // 점수 표시를 위한 폰트 스타일 설정
    this.ctx.font = `${fontSize}px serif`;
    this.ctx.fillStyle = '#525250';

    // 현재 점수와 최고 점수의 x좌표 계산
    const scoreX = this.canvas.width - 75 * this.scaleRatio;
    const highScoreX = scoreX - 125 * this.scaleRatio;
    // 점수를 6자리로 패딩하여 표시 (예: 000123)
    const scorePadded = Math.floor(this.score).toString().padStart(6, '0');
    const highScorePadded = this.globalHighScore.toString().padStart(6, '0');

    // 점수 정보를 캔버스에 그리기
    this.ctx.fillText(scorePadded, scoreX, y);
    this.ctx.fillText(`HI ${highScorePadded}`, highScoreX, y);

    // 현재 스테이지 정보 표시
    const currentStage = this.stageData.data.find((stage) => stage.id === this.currentStageId);
    const stageText = currentStage ? `STAGE ${currentStage.stage}` : 'STAGE 1';
    const stageX = 20 * this.scaleRatio;

    this.ctx.fillText(stageText, stageX, y);
  }
}

export default Score;
