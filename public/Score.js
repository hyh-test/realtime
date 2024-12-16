import { sendEvent, getGameAssets } from './Socket.js';

class Score {
  // 기본 점수 초기화
  score = 0;
  // 로컬 스토리지에 저장될 최고 점수 키
  HIGH_SCORE_KEY = 'highScore';
  // 스테이지 변경 가능 여부
  stageChange = true;
  // 현재 스테이지 ID
  currentStageId = null;
  // 스테이지 데이터 저장
  stageData = null;
  // 아이템 데이터 저장
  itemData = null;
  // 아이템 잠금해제 데이터 저장
  itemUnlockData = null;
  // 획득한 아이템별 점수 저장
  itemScores = {};

  constructor(ctx, scaleRatio) {
    // 캔버스 컨텍스트 설정
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    // 화면 크기 비율 설정
    this.scaleRatio = scaleRatio;

    // 전역에서 Score 인스턴스에 접근할 수 있도록 설정
    window.gameScore = this;

    // 이미 로드된 게임 에셋이 있다면 설정
    const assets = getGameAssets();
    if (assets) {
      this.setGameAssets(assets);
    }
  }

  // 게임 에셋 설정 메서드
  setGameAssets(assets) {
    this.stageData = assets.stages;
    this.itemData = assets.items;
    this.itemUnlockData = assets.itemUnlocks;

    // 게임 시작 시 첫 스테이지로 설정하고 이벤트 전송
    if (this.stageData && this.stageData.data.length > 0) {
      this.currentStageId = this.stageData.data[0].id;
      sendEvent(2, { timestamp: Date.now() });
    }
  }

  // 점수와 스테이지 업데이트
  update(deltaTime) {
    if (!this.stageData) return;

    // 현재 스테이지 정보 찾기
    const currentStage = this.stageData.data.find((stage) => stage.id === this.currentStageId);
    if (!currentStage) return;

    // 현재 점수에 맞는 적절한 스테이지 찾기
    const appropriateStage = this.stageData.data.reduce((prev, curr) => {
      if (this.score >= curr.score) return curr;
      return prev;
    });

    // 시간에 따른 점수 증가
    this.score += deltaTime * currentStage.scorePerSecond * 0.001;

    // 스테이지 변경 처리
    if (appropriateStage.id !== this.currentStageId && this.stageChange) {
      this.stageChange = false;
      const previousStageId = this.currentStageId;
      this.currentStageId = appropriateStage.id;

      // 스테이지 변경 이벤트 전송
      sendEvent(11, {
        currentStage: previousStageId,
        targetStage: appropriateStage.id,
      });
    }

    // 다음 스테이지 변경 가능 여부 업데이트
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
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    if (this.score > highScore) {
      localStorage.setItem(this.HIGH_SCORE_KEY, Math.floor(this.score));
    }
  }

  // 현재 점수 반환
  getScore() {
    return this.score;
  }

  // 화면에 점수 표시
  draw() {
    if (!this.stageData) return;

    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    const y = 20 * this.scaleRatio;
    const fontSize = 20 * this.scaleRatio;

    // 폰트 설정
    this.ctx.font = `${fontSize}px serif`;
    this.ctx.fillStyle = '#525250';

    // 현재 점수와 최고 점수 표시
    const scoreX = this.canvas.width - 75 * this.scaleRatio;
    const highScoreX = scoreX - 125 * this.scaleRatio;
    const scorePadded = Math.floor(this.score).toString().padStart(6, '0');
    const highScorePadded = highScore.toString().padStart(6, '0');

    this.ctx.fillText(scorePadded, scoreX, y);
    this.ctx.fillText(`HI ${highScorePadded}`, highScoreX, y);

    // 현재 스테이지 번호 표시
    const currentStage = this.stageData.data.find((stage) => stage.id === this.currentStageId);
    const stageText = currentStage ? `STAGE ${currentStage.stage}` : 'STAGE 1';
    const stageX = 20 * this.scaleRatio;

    this.ctx.fillText(stageText, stageX, y);
  }
}

export default Score;
