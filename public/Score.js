import { sendEvent, getGameAssets } from './Socket.js';

class Score {
  score = 0;
  HIGH_SCORE_KEY = 'highScore';
  stageChange = true;
  currentStageId = null;
  stageData = null;
  itemData = null;
  itemUnlockData = null;
  itemScores = [];

  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.scaleRatio = scaleRatio;

    // 전역 객체에 인스턴스 저장
    window.gameScore = this;

    // 이미 로드된 에셋이 있다면 바로 설정
    const assets = getGameAssets();
    if (assets) {
      this.setGameAssets(assets);
    }
  }

  setGameAssets(assets) {
    this.stageData = assets.stages;
    this.itemData = assets.items;
    this.itemUnlockData = assets.itemUnlocks;

    // 게임 시작 시 첫 번째 스테이지로 설정
    if (this.stageData && this.stageData.data.length > 0) {
      this.currentStageId = this.stageData.data[0].id;
      sendEvent(2, { timestamp: Date.now() });
    }
  }

  update(deltaTime) {
    if (!this.stageData) return;

    const currentStage = this.stageData.data.find((stage) => stage.id === this.currentStageId);
    if (!currentStage) return;

    // 현재 점수에 해당하는 스테이지 찾기
    const appropriateStage = this.stageData.data.reduce((prev, curr) => {
      if (this.score >= curr.score) return curr;
      return prev;
    });

    // 점수 증가
    this.score += deltaTime * currentStage.scorePerSecond * 0.001;

    // 현재 스테이지가 점수에 맞는 스테이지와 다르면 스테이지 변경
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

    // 스테이지 변경 상태 업데이트
    const nextStage = this.stageData.data.find((stage) => stage.id === appropriateStage.id + 1);
    this.stageChange = nextStage ? Math.floor(this.score) < nextStage.score : false;
  }

  isItemAvailableInCurrentStage(itemId) {
    // itemUnlockData가 없거나 data 속성이 없으면 false 반환
    if (!this.itemUnlockData || !this.itemUnlockData.data) return false;

    // 현재 스테이지의 아이템 언락 정보 찾기
    const currentStageUnlock = this.itemUnlockData.data.find(
      (unlock) => unlock.stage_id === this.currentStageId,
    );

    // 현재 스테이지의 언락 정보가 있고, 해당 아이템이 허용 목록에 있으면 true 반환
    return currentStageUnlock && currentStageUnlock.item_id.includes(itemId);
  }

  getItem(itemId) {
    if (!this.itemData || !this.itemData.data) return;

    const item = this.itemData.data.find((item) => item.id === itemId);
    if (!item) {
      console.log(`Item with ID ${itemId} not found.`);
      return;
    }

    this.score += item.score;
    this.itemScores.push({
      itemId: item.id,
      score: item.score
    });
    
    console.log(`Item collected: +${item.score} points`);
  }

  reset() {
    this.score = 0;
    if (this.stageData && this.stageData.data.length > 0) {
      this.currentStageId = this.stageData.data[0].id;
    }
    this.stageChange = true;
  }

  setHighScore() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    if (this.score > highScore) {
      localStorage.setItem(this.HIGH_SCORE_KEY, Math.floor(this.score));
    }
  }

  getScore() {
    return this.score;
  }

  draw() {
    if (!this.stageData) return;

    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    const y = 20 * this.scaleRatio;
    const fontSize = 20 * this.scaleRatio;

    this.ctx.font = `${fontSize}px serif`;
    this.ctx.fillStyle = '#525250';

    // 점수 표시
    const scoreX = this.canvas.width - 75 * this.scaleRatio;
    const highScoreX = scoreX - 125 * this.scaleRatio;
    const scorePadded = Math.floor(this.score).toString().padStart(6, '0');
    const highScorePadded = highScore.toString().padStart(6, '0');

    this.ctx.fillText(scorePadded, scoreX, y);
    this.ctx.fillText(`HI ${highScorePadded}`, highScoreX, y);

    // 현재 스테이지 표시
    const currentStage = this.stageData.data.find((stage) => stage.id === this.currentStageId);
    const stageText = currentStage ? `STAGE ${currentStage.stage}` : 'STAGE 1';
    const stageX = 20 * this.scaleRatio;

    this.ctx.fillText(stageText, stageX, y);
  }
}

export default Score;
