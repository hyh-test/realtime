# realtime

# 게임 기능 및 구현 사항

이 게임은 다양한 기능을 제공하여 플레이어에게 흥미로운 경험을 제공합니다. 아래는 구현된 주요 기능 목록입니다.

## 필수 기능

1. **시간에 따른 점수 획득**
   - 플레이어는 게임 진행 중 시간에 따라 점수를 획득합니다. 

2. **스테이지 구분 및 스테이지에 따른 점수 획득 구분**
   - 게임은 여러 스테이지로 나뉘어 있으며, 각 스테이지에서 설정된 초당 점수에 따라 점수가 증가하며 각 점수증가폭은 stage.json에 저장되어 있다.

3. **아이템 획득**
   - 플레이어는 게임 내에서 다양한 아이템을 획득할 수 있습니다. 각 아이템은 고유한 점수를 가지고 있으며, 아이템의 사용 가능 여부는 스테이지에 따라 다릅니다.

4. **아이템 획득 시 점수 획득**
   - 아이템을 획득하면 해당 아이템에 설정된 점수가 플레이어의 총 점수에 추가됩니다.

5. **스테이지 별 아이템 생성 구분**
   - 각 스테이지에 따라 생성되는 아이템이 다릅니다. 특정 스테이지에서만 사용할 수 있는 아이템이 생성된다 1스테이지에는 가장 점수가 낮은 아이템만 생성되지만 마지막 6스테이지에서는 모든 아이템이 생성된다.
   - 만약 현재 스테이지에서 나오지 말아야할 아이템이 나오면 게임을 초기화 시킨다(처음 화면으로 돌아가지는 않고 스코어는 0 스테이지는 1부터 다시 시작한다 )

6. **아이템 별 획득 점수 구분**
   - 각 아이템은 고유한 점수를 가지고 있으며, 아이템의 점수는 `item.json` 파일에서 정의됩니다.

7. **Socket을 이용한 Broadcast 기능 추가**
   - Socket.IO를 사용하여 게임 내에서 실시간으로 메시지를 브로드캐스트할 수 있는 기능이 구현되었습니다. 이를 통해 플레이어 간의 소통이 가능합니다.

8. **최고 점수 저장 관리**
   - 모든 플레이어중 최고 점수는 서버에 저장됩니다.

## Redis 클라우드 연동

redis 클라우드 연동과 저장까지만 구현되어서 완성시키지 못했다.
