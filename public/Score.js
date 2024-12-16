import { sendEvent } from './Socket.js';

class Score {
  score = 0;
  HIGH_SCORE_KEY = 'highScore';
  stageChange = true;
  currentStageId = null; // 초기값을 null로 설정
  stageData = null;
  itemData = null;
  itemUnlockData = null;

  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.scaleRatio = scaleRatio;

    this.loadAssets().then(() => {
      // 에셋 로드 후 초기 스테이지 설정
      if (this.stageData && this.stageData.data.length > 0) {
        this.currentStageId = this.stageData.data[0].id;
        // 게임 시작 시 서버에 초기화 요청
        sendEvent(2, {
          timestamp: Date.now(),
        });
      }
    });
  }

  // JSON 파일 로드 함수
  async loadAssets() {
    try {
      const stageResponse = await fetch('assets/stage.json');
      const itemResponse = await fetch('assets/item.json');
      const itemUnlockResponse = await fetch('assets/item_unlock.json');

      // JSON 파일 파싱
      this.stageData = await stageResponse.json();
      this.itemData = await itemResponse.json();
      this.itemUnlockData = await itemUnlockResponse.json();

      // 로드 완료 후 확인
      console.log('Stage Data:', this.stageData);
      console.log('Item Data:', this.itemData);
      console.log('Item Unlock Data:', this.itemUnlockData);

      // 게임 시작 시, 현재 스테이지 설정 (점수에 맞는 스테이지부터 시작)
      this.setInitialStage();
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  }

  // 게임 시작 시 현재 스테이지를 설정 (점수에 맞는 스테이지부터 시작)
  setInitialStage() {
    if (!this.stageData) return;

    // 스테이지 데이터에서 목표 점수를 기반으로 시작할 스테이지를 결정
    // 처음에는 항상 1스테이지부터 시작
    for (let i = 0; i < this.stageData.data.length; i++) {
      const stage = this.stageData.data[i];

      // 현재 점수가 해당 스테이지 목표 점수보다 크면, 그 스테이지로 시작
      if (this.score >= stage.score) {
        this.currentStageId = stage.id; // 해당 스테이지로 설정
      } else {
        break; // 목표 점수보다 큰 스테이지가 없으면 더 이상 확인할 필요 없음
      }
    }

    console.log(`Initial Stage Set: ${this.currentStageId}`);
  }

  update(deltaTime) {
    if (!this.stageData) return; // stageData가 로드되지 않았다면 종료

    // 현재 스테이지 찾기 (find 사용)
    const currentStage = this.stageData.data.find((stage) => stage.id === this.currentStageId);
    if (!currentStage) return; // currentStage가 없으면 처리하지 않음

    // 현재 스테이지의 목표 점수를 초과하면 다음 스테이지로 넘어가야 함
    const nextStage = this.stageData.data.find((stage) => stage.id === currentStage.id + 1);

    const scorePerSecond = currentStage.scorePerSecond;

    // 점수 증가
    this.score += deltaTime * scorePerSecond * 0.001;

    // 목표 점수에 도달하면 다음 스테이지로 넘어감
    // **다음 스테이지의 목표 점수**를 비교
    if (nextStage && Math.floor(this.score) >= nextStage.score && this.stageChange) {
      this.stageChange = false;
      const previousStageId = this.currentStageId; // 이전 스테이지 ID 저장
      this.currentStageId = nextStage.id; // 다음 스테이지로 설정
      sendEvent(11, {
        currentStage: previousStageId,
        targetStage: nextStage.id,
      });
      console.log(`Stage changed to: ${nextStage.stage}`);
    }

    this.stageChange = false;

    // 스테이지가 바뀌면, 점수가 목표 점수보다 작을 때 다시 stageChange를 true로 설정
    if (nextStage && Math.floor(this.score) < nextStage.score) {
      this.stageChange = true;
    }

    // 만약 마지막 스테이지에 도달했다면 더 이상 스테이지가 바뀌지 않음
    if (!nextStage) {
      this.stageChange = false; // 마지막 스테이지에선 더 이상 stageChange하지 않음
    }
  }

  getItem(itemId) {
    this.score += 0;
  }

  reset() {
    this.score = 0;
    // 리셋할 때도 첫 번째 스테이지로 설정
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
    if (!this.stageData) return; // stageData가 로드되지 않았다면 종료

    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    const y = 20 * this.scaleRatio;

    const fontSize = 20 * this.scaleRatio;
    this.ctx.font = `${fontSize}px serif`;
    this.ctx.fillStyle = '#525250';

    const scoreX = this.canvas.width - 75 * this.scaleRatio;
    const highScoreX = scoreX - 125 * this.scaleRatio;

    const scorePadded = Math.floor(this.score).toString().padStart(6, 0);
    const highScorePadded = highScore.toString().padStart(6, 0);

    this.ctx.fillText(scorePadded, scoreX, y);
    this.ctx.fillText(`HI ${highScorePadded}`, highScoreX, y);

    // 현재 스테이지 표시 (find 사용)
    const currentStage = this.stageData.data.find((stage) => stage.id === this.currentStageId);
    const currentStageText = currentStage ? `STAGE ${currentStage.stage}` : 'STAGE 1';

    // 스테이지 텍스트 왼쪽으로 배치
    const stageX = 20 * this.scaleRatio; // 왼쪽에 위치하도록 stageX 수정
    this.ctx.fillText(currentStageText, stageX, y);
  }
}

export default Score;
