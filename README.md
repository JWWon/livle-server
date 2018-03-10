# LIVLE
```
This Project is Back-End Server for LIVLE which provides client to watch a concert twice a month by subscribing service.
Server is hosted on AWS Labmda and automating process using AWS CloudFormation.
© 2018 LIVLE
```

# Related Projects
* Client       : https://github.com/livle-dev/livle-client
* Partner Page : https://github.com/livle-dev/livle-partner
* Landing Page : https://github.com/livle-dev/livle-landing

# Quick Start - SERVER

### 1. 로컬 환경 변수의 NODE_ENV를 dev로 설정
사용하는 쉘에 따라 `~/.zshrc` or `~/.bashrc`에 다음 줄 추가
`export NODE_ENV=dev`

### 2. 사용할 환경변수 설정
`.env` 파일에 다음 정보 입력

```yaml
# Local
DB_NAME=
DB_USER=
DB_PASS=
DB_HOST=localhost
DB_PORT=3306

IMP_KEY=
IMP_SECRET=

AWS_PROFILE=livle-serverless

FCM_SERVER_KEY=

# Card info for test
CARD_NUMBER='1111-2222-3333-4444'
EXPIRY='2017-12'
BIRTH=920101
PASSWORD=00 # 첫 두자리

# FB info for test
# https://developers.facebook.com/tools/explorer 에서 구할 수 있음
FB_TOKEN=

PUSHER_KEY=
PUSHER_SECRET=

# 테스트 셋을 돌릴 때 메일이 발송될 주소
TESTER_EMAIL=
# 테스트 셋을 돌릴 때 푸시가 발송될 디바이스의 토큰
TEST_FCM_TOKEN=

# Dev server
# 평소에는 주석, migrate 할 때 Local 주석하고 여기 주석 풀기
#DB_HOST=
#DB_PORT=3306
#DB_NAME=
#DB_PASS=
#DB_USER=
```

### 3. 로컬 데이터베이스 마이그레이션
- Mysql 설치 후 위에 입력한 이름(`DB_NAME`)에 해당하는 데이터베이스 생성
- `$ node db/migrate` : 로컬 마이그레이션
- `$ node db/reset` : 로컬 마이그레이션 + 시드 데이터 추가

### 4. AWS CLI 설정
- aws cli 설치 후 `livle-serverless`라는 이름으로 profile을 만듭니다.

### 5. 테스트
- 위 세팅을 모두 마치고 `yarn test` 커맨드 실행해서 에러 없으면 성공

# Deploy
AWS CLI 통해서 credential 세팅해두어야 함
`keys.yml` 파일에 아래 정보 입력 후 `yarn deploy`

```yaml
DB_HOST:
DB_PORT:
DB_NAME:
DB_PASS:
DB_USER:
IMP_KEY:
IMP_SECRET:
PUSHER_KEY:
PUSHER_SECRET:
FCM_SERVER_KEY:
```

# Project Structure
![](http://drive.google.com/uc?export=view&id=1OSAwR9WeHGqZjJCp3ovsmXRk_JSsN4ua)

# Contributer
![](http://drive.google.com/uc?export=view&id=1PexrKHr5vVgiM-hXCP-tOf7HVaaF_AQx)
* `Jiwoon Won` email: wonjiwn@naver.com, github: https://github.com/JWWon
* `Jaeseong Seo` email: 07js23@gmail.com, github: https://github.com/js-seo
* `Sanghyuk Son` email: saanghyuk@gmail.com, github: https://github.com/saanghyuk
