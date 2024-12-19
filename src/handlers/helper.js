import { getUsers, removeUser } from '../models/user.model.js';
import { CLIENT_VERSION } from '../constants.js';
import handlerMappings from './handlerMapping.js';
import { createStage } from '../models/stage.model.js';

// 소켓 연결 처리 함수
export const handleConnection = (socket, userUUID) => {
  console.log(`New user connected: ${userUUID} with socket ID ${socket.id}`); // 새로운 사용자 연결 로그
  console.log('Current users:', getUsers()); // 현재 사용자 목록 로그

  // 스테이지 빈 배열 생성
  createStage(userUUID); // 사용자 UUID에 대한 스테이지 생성

  socket.emit('connection', { uuid: userUUID }); // 클라이언트에 연결 정보 전송
};

// 소켓 연결 해제 처리 함수
export const handleDisconnect = (socket, uuid) => {
  removeUser(socket.id); // 소켓 ID로 사용자 삭제
  console.log(`User disconnected: ${socket.id}`); // 사용자 연결 해제 로그
  console.log('Current users:', getUsers()); // 현재 사용자 목록 로그
};

// 이벤트 처리 함수
export const handleEvent = (io, socket, data) => {
  // 클라이언트 버전 확인
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit('response', { status: 'fail', message: 'Client version mismatch' }); // 버전 불일치 응답 전송
    return; // 함수 종료
  }

  const handler = handlerMappings[data.handlerId]; // 핸들러 매핑에서 핸들러 가져오기
  if (!handler) {
    socket.emit('response', { status: 'fail', message: 'Handler not found' }); // 핸들러 없음 응답 전송
    return; // 함수 종료
  }

  console.log('handleEvent received data:', {
    handlerId: data.handlerId, // 수신된 핸들러 ID 로그
    uuid: data.uuid, // 수신된 UUID 로그
    payload: data.payload, // 수신된 페이로드 로그
  });

  // UUID가 없을 경우 처리
  if (!data.uuid) {
    console.error('UUID가 없습니다:', data); // UUID 없음 오류 로그
    socket.emit('response', { status: 'fail', message: 'UUID is required' }); // UUID 필요 응답 전송
    return; // 함수 종료
  }

  const response = handler(data.uuid, data.payload); // 핸들러 호출 및 응답 받기
  if (response.broadcast) {
    io.emit('broadcast', response); // 브로드캐스트 응답 전송
    return; // 함수 종료
  }
  socket.emit('response', response); // 소켓에 응답 전송
};
