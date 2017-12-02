# Development Settings
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

# Card info for test
CARD_NUMBER='1111-2222-3333-4444'
EXPIRY='2017-12'
BIRTH=920101
PASSWORD=00 # 첫 두자리

# Dev server
# 평소에는 주석, migrate 할 때 Local 주석하고 여기 주석 풀기
#DB_HOST=
#DB_PORT=3306
#DB_NAME=
#DB_PASS=
#DB_USER=
```

# Migrate
*Production 이후에는 하면 안되는 방법*
위에서 Local에 주석처리, Dev server 부분을 주석 풀고 `node ./migrate.js`


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
```
