---
layout: post
title: "도커로 설정하는 서비스 개발/운영 환경"
tags: [Backend, Docker]
---

[SPARCS](https://sparcs.org)에서 내가 진행하는 프로젝트([kono](https://github.com/sparcs-kaist/kono))의 개발 및 운영 환경을 만들어야 할 때가 왔다. 사실 프로젝트 시작할 때 이것부터 하고 시작해야 하지만... 어쩌다 보니 프로젝트가 절반가량 진행된 시점에서 하게 되었다. `npm start`랑 `npm build`밖에 모르던 사람이 이 과제를 해결하는 과정을 차근차근 알아보자. 

<!--more-->

## 도커 (Docker)

![docker-logo]({{site.url}}/images/2019-10-25-devlog-docker/docker-logo.png)

도커에 관해서 주변에서 많은 얘기를 들었지만 (SPARCS 개발 서버인 Whale도 도커 기반이지만 Whale을 쓰면서 도커 공부를 할 생각은 1도 안했다.) 배울 기회가 없었는데, 프로젝트의 PM을 맡고 나니 공부할 수밖에 없었다 :(

PM(나)에게 주어진 상황은 다음과 같았다.

- 서버 권한
    - 현재는 AWS EC2 머신의 `sudo` 권한이 있음 
    - 하지만 서버 세팅 완료 후에는 머신에 직접 (SSH 등을 이용해서) 접근할 수 없고, 다른 방법으로 접근해야 함
        - 다른 접근 수단을 통해 서비스 개발, 배포, 업데이트, 버그 발생 시 로그 확인 및 핫픽스 등을 수행해야 함
        - 미래의 PM이나 sysop, SPARCS 서버 관리자들도 작업을 원활하게 수행할 수 있도록 세팅해야 함
- 띄워야 하는 서비스
    - 웹 서버
    - API 서버
    - DB (MySQL)
        - 개발용 DB랑 운영용 DB를 따로 썼으면 좋겠음 (권한, 보안 문제 때문에)

"서버 권한" bullet을 보면 알겠지만, 한마디로 도커를 쓰라는 얘기다. 호스트 머신에서 DB, API, 웹 서버를 각각 담당하는 여러 개의 컨테이너를 띄운다. 그러면 관리를 위해서 호스트 머신에 접근하지 않고 바로 컨테이너에 SSH로 접근하여 원하는 작업을 할 수 있다.

하지만 일주일 전의 PM은 안타깝게도 도커에 관해 1도 모르는 상황이었기 때문에 도커 공부부터 해야 했다.

> - [Docker Official Site](https://www.docker.com/)
> - [Docker Documentation](https://docs.docker.com/)
> - Docker 관련 좋은 튜토리얼
>   - [subicura.com - 초보를 위한 도커 안내서](https://subicura.com/2017/01/19/docker-guide-for-beginners-1.html)
>   - [subicura.com - 도커를 이용한 웹서비스 무중단 배포하기](https://subicura.com/2016/06/07/zero-downtime-docker-deployment.html)

## 컨테이너 띄우기

도커에서 컨테이너를 띄우는 것은 매우 간단하다. 그냥 base image를 정하고, `docker run`으로 띄우면 된다!

하지만 컨테이너를 띄운 후의 작업이 복잡해진다. 예를 들어 `ubuntu:16_04`를 base image로 하고, 이 위에 API 서버를 띄운다고 생각해 보자. 우리 API 서버는 Node.js + Express.js니까 ubuntu OS 위에 Node와 NPM을 깔아야 하고, 버전 관리를 위한 git, SSH로 컨테이너에 접속할 수 있도록 SSH Daemon도 띄워야 하고... 세팅해야 할 것이 한두가지가 아니다. 만약 나 말고 다른 사람이 세팅을 하고 싶으면 어떻게 알려줘야 할까? 세팅을 하는 과정에서 실행한 명령어들을 차례대로 메모장에 적어놓고 인수인계할 사람한테 가져다 주면 되나??

그래서 존재하는 게 Dockerfile이다. Dockerfile은 base image에서 출발해서 실행할 명령들을 차례대로 적어 놓은 설정 파일이다. `docker build` 명령을 날리면 도커는 Dockerfile을 보고 명령을 하나하나 실행해서 새로운 이미지를 생성한다. 이 이미지는 우리가 원하는 것들이 정확하게 세팅된 이미지이므로 그냥 `docker run`하면 모든 것이 갖추어진 컨테이너가 올라간다 bb

#### **`kono/kono-api/Dockerfile`**
```Dockerfile
FROM node:12
MAINTAINER inhibitor <inhibitor@kaist.ac.kr>

WORKDIR /usr/src/app

VOLUME /usr/src/app
VOLUME /usr/src/assets
VOLUME /usr/src/log

RUN npm i -g nodemon

EXPOSE 4000

CMD [ "/bin/sh", "-c", "NODE_ENV=production nodemon bundle.js > /usr/src/log/stdout.log 2> /usr/src/log/stderr.log" ]
```

예시로 우리 API 서버의 Dockerfile을 들고 왔다. Base image로 `node:12`를 들고 왔기 때문에 `npm`이나 `node`를 따로 설치하지 않고 사용할 수 있다. (SSH 접속은 못하지만) 소스 파일이 수정되었을 때 자동으로 서버를 재시작하는 `nodemon` module을 설치한 후, 서버를 실행해준다.

### 개발용 DB와 운영용 DB 분리하기

도커의 또 다른 장점 중 하나로, 똑같이 생긴 컨테이너를 여러 개 띄우는 것이 간단하다. 개발용 DB(테스트할 때 마음대로 데이터 넣고 뺄 수 있는 곳)와 운영용 DB는 데이터만 다르지 테이블과 schema는 똑같이 생겼다. 그러니까 똑같은 Dockerfile에서 이미지를 빌드하고, 이 이미지로부터 컨테이너를 여러 개 만들면 된다. 물론 비밀번호 같은 환경 변수는 다르게 설정해 주어야 한다.

### 볼륨 (volume)

그런데 위 Dockerfile에는 조금 이상한 점이 있는데, 프로젝트 소스 파일을 가져와서 빌드하는 부분이 보이지 않는다는 것이다. 이 작업은 다른 컨테이너에서 진행한다. 앞서 말했듯이 **컨테이너에 접속해서 업데이트 및 배포를 진행**해야 하기 때문에, 이 기능을 위한 컨테이너를 따로 만들었다.

도커에서 볼륨(volume)은 컨테이너의 file structure와 호스트의 file structure을 서로 공유하는 기능이다. 볼륨을 사용하면,

1. 컨테이너의 데이터를 보존할 수 있다. 
    - 도커에서는 컨테이너가 내려가면 (`docker stop` 등으로) 컨테이너에서 생성된 파일은 **모두 손실된다**. 다시 `docker run`으로 올려도 그 컨테이너의 이미지로부터 *fresh*한 새 컨테이너가 생성될 뿐이다.
    - 따라서 데이터를 보존해야 하는 DB와 같은 경우에는 아무 대책 없이 컨테이너로 만들었다가 잘못 내리면 소중한 유저의 데이터를 날려먹는 사태가 발생할 것이다 -_-
    - 따라서 이러한 데이터는 반드시 컨테이너 외부인 호스트에 저장해야 한다. 볼륨을 활용하여 컨테이너의 특정 디렉토리와 호스트의 디렉토리를 mapping하여, 이 디렉토리 내의 데이터를 보존한다. 이러면 컨테이너가 내려갔다가 새로운 컨테이너로 올라와도 데이터가 유지된다.
2. 여러 컨테이너 간에 file structure를 공유할 수 있다.
    - 두 컨테이너에서 동일한 호스트 디렉토리에 mapping된 볼륨을 사용하고 있다면, 두 컨테이너에서 서로 파일을 공유할 수 있다!

위의 Dockerfile을 다시 보자.

#### **`kono/kono-api/Dockerfile`**
```Dockerfile
...
VOLUME /usr/src/app
VOLUME /usr/src/assets
VOLUME /usr/src/log
...
```

API 서버가 올라간 컨테이너(`api`)는 3개 디렉토리를 볼륨으로 사용하고 있다.

 `/usr/src/app`은 API 서버의 소스 코드가 들어있는 디렉토리이다. 관리용 컨테이너(`maintainer`)에서 `git` 등으로 업데이트한 소스 코드가 **자동**으로(!) 이 디렉토리로 들어온다. 앞서 `nodemon`으로 서버를 실행했기 때문에 `maintainer`에서 소스 코드를 업데이트하면 `api` 컨테이너에는 접속하지 않아도 알아서 서버가 업데이트된다!! (물론 짧은 downtime은 있지만...)

`/usr/src/assets`는 서비스를 사용하는 유저가 API 엔드포인트를 통해 업로드한 파일을 저장하는 디렉토리이다. 이걸 보존하지 않으면 큰일난다 :(

`/usr/src/log`는 서버의 로그를 저장하는 디렉토리이다. `maintainer` 컨테이너에서 로그 파일을 볼 수 있기 때문에 `api` 컨테이너에는 접근하지 않아도 된다.

정리하면, `api` 컨테이너에는 접근하지 않고 `maintainer`에서 하고 싶은 일을 다 할 수 있다. 이 컨테이너에서 수정하는 대로 `api`가 알아서 잘 돌아간다 bb

### 도커에서 이런 것도 된다구?

Dockerfile은 명령을 "순서대로" 실행하는 메모장이기 때문에 `apt-get`이든 `useradd`든 리눅스 위에서 할 수 있는 건 다 할 수 있다. `maintainer` 컨테이너에서 SSH Daemon을 실행하고 SSH 접근용 계정(`wheel`, `sysop`)을 만드는 것도 Dockerfile에 적어 놓았다.

#### **`kono/Dockerfile-maintainer`**
```Dockerfile
FROM ubuntu:16.04
MAINTAINER inhibitor <inhibitor@kaist.ac.kr>

# Install and setup ssh
RUN apt-get update
RUN apt-get install -y openssh-server
RUN mkdir /var/run/sshd
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd
ENV NOTVISIBLE "in users profile"
RUN echo "export VISIBLE=now" >> /etc/profile

# Create users
RUN adduser --gecos "" --disabled-password sysop
RUN usermod -G sudo sysop
RUN adduser --gecos "" --disabled-password wheel
RUN usermod -G sudo sysop

# Install node.js
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

# Install some commands
RUN apt-get install -y git
RUN apt-get install -y sudo
RUN apt-get install -y vim
RUN apt-get install -y mysql-client
...

# Execute ssh daemon
CMD [ "/bin/sh", "-c", "/usr/src/scripts/deploy.sh && /usr/sbin/sshd -D" ]
```

당연하게도 GitHub에 공개되는 Dockerfile에 우분투 계정 비밀번호나 이런 걸 저장하는 건 하면 안 된다 -_- Dockerfile을 보면 `useradd` 명령을 실행할 때 `--disabled-password` 옵션을 넣어서 비밀번호를 비활성화 한 후, 호스트 머신에서 컨테이너에 직접 접근해서 비밀번호를 수동으로 설정해주었다.

Dockerfile에는 단 하나의 `CMD` 명령을 넣을 수 있는데, 이것이 컨테이너가 올라간 후 실행할 명령이 된다. 이 명령 프로세스가 종료되면 컨테이너가 내려간다.

그러면 "나는 컨테이너가 올라가면 프로세스를 두 개 올리고 싶은데??" 라는 생각이 들 수 있다. (예를 들어 SSH Daemon이랑 MySQL Daemon을 돌리고 싶다던가...) 그러면 shell로 (`/bin/bash`) 원하는 명령을 `&&` 같은 걸로 이어서 실행하면 된다. 참고로 Dockerfile의 `CMD`에 적은 command는 shell을 통해 실행되는 것이 아니기 때문에 pipeline(`|`), redirection(`>`, `<`) 같은 것도 먹히지 않는다. 그러니까 `CMD [ "<command 1>", "&&", "<command 2>" ]`처럼 쓰는 것이 아니라 `CMD [ "/bin/sh", "-c", "<command 1> && <command 2>" ]`로 적어야 에러가 나지 않는다.

## Docker-compose

Dockerfile에 적을 수 없고 꼭 `docker run` 명령을 실행할 때 옵션으로 넣어주어야 하는 것들이 있다.

- **환경 변수**: `-e` 옵션으로 넣는다. `-e "KEY=VALUE"`
- **볼륨**: `-v` 옵션으로 넣는다. `-v host-dir:container-dir`
- **포트**: `-p` 옵션으로 넣는다. `-p host-port:container-port`
- 더 많은데 자세한 것은 [Documentation](https://docs.docker.com/engine/reference/run/) 참조

이것저것 설정할 것들이 많아지면 `docker run` 명령이 길어지기 때문에 메모장에 적어 놓아야 할까...? 그래서 Docker-compose를 쓴다.

> [Docker-compose Documentation](https://docs.docker.com/compose/reference/overview/)

지금까지 내가 이해한 바로는, docker-compose는 여러 개의 "서비스"(우리 kono 서비스의 "웹 서버", "API 서버" 같이 컨테이너마다 올라가는 것들)를 효과적으로 관리할 수 있는 도구이다. `docker run` 명령을 통해 실행할 옵션들을 `docker-compose.yml`라는 파일에 적어 놓으면 `docker-compose build`, `docker-compose up` 명령만으로 모든 컨테이너를 한 번에 띄울 수 있다.

Docker-compose의 잠재력은 더 많은 것 같기는 한데... (여러 개의 호스트 머신에서 컨테이너를 띄울 수 있는 기능이라던지, 한 서비스에 여러 개의 컨테이너를 대응시키고 load balancing을 한다던지) 아직 도커를 알게 된 지 일주일밖에 되지 않은 시점이라 자세히 읽어보진 못했다. 다음 프로젝트에서 더 공부해보기로?

지금 프로젝트에서는 그냥 volume, port, 환경 변수 설정을 `docker-compose.yml` 파일에 적어 놓는 정도로 docker-compose를 쓰고 있다.

#### **`kono/docker-compose.yml`**
```yml
version: '3.7'

services:
  db_production:
    build: db/
    volumes:
      - data_production_volume:/var/lib/mysql
    environment:
      DB_ENV: "production"
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/db_root_password
    secrets:
      - db_root_password
      - db_dev_password
      - db_unauthorized_api_password
      - db_authorized_api_password

  db_dev:
    build: db/
    volumes:
      - data_dev_volume:/var/lib/mysql
    ports:
      - "3306:3306"
    environment:
      DB_ENV: "development"
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/db_root_password
    secrets:
      - source: db_root_password_dev
        target: db_root_password

  api:
    depends_on:
      - maintainer
    restart: always
    build: kono-api/
    environment:
      HOST: "kono.sparcs.org"
      PORT: 4000
      DB_HOST: "db_production"
      DB_PORT: 3306
      DB_AUTH_USER: "api"
      DB_AUTH_PASSWORD_FILE: /run/secrets/db_authorized_api_password
      DB_USER: "unauthorized_api"
      DB_PASSWORD_FILE: /run/secrets/db_unauthorized_api_password
      DB_DATABASE: "kono"
      PASSWORD_KEY_FILE: /run/secrets/api_password_key
      JWT_KEY_FILE: /run/secrets/api_jwt_key
    volumes:
      - api_build:/usr/src/app
      - api_log:/usr/src/log
      - app_static:/usr/src/assets
    secrets:
      - db_authorized_api_password
      - db_unauthorized_api_password
      - api_password_key
      - api_jwt_key

  maintainer:
    build:
      context: .
      dockerfile: Dockerfile-maintainer
    ports:
      - "8022:22"      
    environment:
      GENERATE_SOURCEMAP: "false"
    volumes:
      - api_build:/usr/src/api/dist
      - api_log:/usr/src/log/api
      - app_build:/usr/src/app/build
      - nginx_log:/usr/src/log/nginx
    secrets:
      - db_root_password

  nginx:
    depends_on:
      - api
      - maintainer
    restart: always
    build: nginx/
    ports:
      - "80:80"
    volumes:
      - app_build:/usr/share/nginx/html
      - nginx_log:/var/log/nginx
      - app_static:/usr/share/nginx/assets

volumes:
  data_production_volume:
  data_dev_volume:
  api_build:
  api_log:
  app_build:
  nginx_log:
  app_static:

secrets:
  db_root_password:
    file: config/production/db_root_password
  db_dev_password:
    file: config/production/db_dev_password
  db_unauthorized_api_password:
    file: config/production/db_unauthorized_api_password
  db_authorized_api_password:
    file: config/production/db_authorized_api_password
  db_root_password_dev:
    file: config/dev/db_root_password
  api_password_key:
    file: config/production/api_password_key
  api_jwt_key:
    file: config/production/api_jwt_key
```

### Docker Secret
 `docker run` 명령을 실행할 때 환경 변수를 `docker-compose.yml` 파일에 미리 넣어 놓을 수 있다고 했는데, 이 환경 변수가 MySQL 루트 비밀번호처럼 공개된 파일에 적을 수 없는 것이라면 어떻게 해야 할까? 
 
 **Docker secret**이라는 게 있다. ([Documentation](https://docs.docker.com/engine/swarm/secrets/)) 
 
 `docker-compose.yml`을 보면,
 - `db_production` 서비스에서   
    - `MYSQL_ROOT_PASSWORD_FILE` 환경 변수를 `/run/secrets/db_root_password`로 설정하고, 
    - 밑에 `secrets` 목록에 `db_root_password`를 적어 놓는다. 
 - 그리고 맨 밑에 `secrets:`를 보면,
    - `db_root_password`를 `config/production/db_root_password` 파일로부터 불러온다.

무슨 일이 일어나고 있는 걸까? 

- Docker compose가 **호스트**의 `config/production/db_root_password` 파일로부터 `db_root_password`라는 **Docker secret**을 생성한다.
- `db_production` 컨테이너가 올라갈 때, 이 docker secret을 컨테이너의 `/run/secrets/db_root_password` 위치에 저장한다.
- 그러면 MySQL이 시작할 때 이 파일로부터 루트 비밀번호를 설정할 수 있다.

정리하면, `docker-compose.yml` 파일에 민감한 정보를 적지 않고 호스트 머신에 저장한 후, (위의 `config/` 처럼) 그 경로만으로 컨테이너들의 환경 변수를 설정할 수 있다. 컨테이너 내에서 이 값들에 접근할 수 있다.

### 컨테이너 간 접속

우리 서비스에서 API 서버는 데이터베이스에 SQL 쿼리를 보내서 데이터를 가져와야 한다. API 서버와 DB 모두 도커를 이용해서 컨테이너에 올라가 있다. 그렇다면 API 서버에서 데이터베이스에 접속하기 위해서는:

- DB 컨테이너에서 MySQL Daemon을 특정 포트(3306번)로 열어놓은 후, 호스트 머신의 포트와 이 포트를 연결
- API 컨테이너에서는 호스트 머신의 포트로 쿼리를 보냄

이렇게 진행해야 한다.

하지만 이렇게 하면 단점이 있다. 

1. 호스트 머신의 IP를 컨테이너에서 알고 있어야 하며, 
2. API 서버 말고 외부에서도 DB 컨테이너에 접속할 수 있으므로 보안에 신경써야 한다. (방화벽 설정 같은 걸 해 놓아야 한다.)

그런데 docker compose를 쓰면? 이럴 필요가 없다. Docker compose를 통해 동시에 올라가는 서비스들은 같은 **"네트워크"** 내에 속해 있다. (네트워크도 docker compose에서 중요한 개념 중 하나인 것 같은데, 자세히 공부는 못해 봤다.) 호스트 머신을 통해 접속하지 않아도 서로 접속할 수 있다.

[여기](https://docs.docker.com/compose/networking/)를 보면 다음과 같이 쓰여 있다.

> For example, suppose your app is in a directory called `myapp`, and your `docker-compose.yml` looks like this:
> 
> *예를 들어, 당신의 앱이 `myapp` 디렉토리에 있고, `docker-compose.yml` 파일이 다음과 같다고 생각해 봅시다.*
> ```yml
> version: "3"
> services:
>  web:
>    build: .
>    ports:
>      - "8000:8000"
>  db:
>    image: postgres
>    ports:
>      - "8001:5432"
> ```
> When you run `docker-compose up`, the following happens:
> 1. A network called `myapp_default` is created.
> 2. A container is created using `web`’s configuration. It joins the network `myapp_default` under the name `web`.
> 3. A container is created using `db`’s configuration. It joins the network `myapp_default` under the name `db`.
>
> *`docker-compose up`을 실행하면, 다음 과정이 실행됩니다.*
>
> 1. *`myapp_default` 네트워크가 생성됩니다.*
> 2. *`web`의 설정(=Dockerfile)으로부터 컨테이너가 생성되고, `myapp_default` 네트워크에 `web`이라는 이름으로 추가됩니다.*
> 3. *`db`의 설정으로부터 컨테이너가 생성되고, `myapp_default` 네트워크에 `db`라는 이름으로 추가됩니다.*
> 
> (중략)
> 
> Each container can now look up the hostname `web` or `db` and get back the appropriate container’s IP address. For example, `web`’s application code could connect to the URL `postgres://db:5432` and start using the Postgres database.
>
> **컨테이너는 `web`이나 `db` hostname을 사용해서 이에 해당하는 컨테이너의 IP 주소를 가져올 수 있습니다.** *예를 들어, `web`에 올라간 웹 어플리케이션 코드에서 `postgres://db:5432` URL로 연결하여 Postgres 데이터베이스에 접속할 수 있습니다.*

정말 멋진 기능이다. `docker-compose.yml` 파일을 다시 보면...

```yml
services:
    db_production:
        ...
    api:
        ...
        environment:
            DB_HOST: "db_production"
            DB_PORT: 3306
            ...
```

이렇게 적어 넣으면, `db_production` 컨테이너는 따로 포트를 호스트 머신으로 mapping하지 않았는데도 `api`에서 이 컨테이너에 `db_production` 이름으로 접속할 수 있다. 외부에서는 당연히 접속할 수 없다. bb

## 정리

이렇게 해서 복잡한 설정이 필요한 여러 컨테이너들(개발 DB, 운영 DB, API 서버, nginx 웹 서버)을 단 한 줄의 명령, `docker-compose up -d --build`만으로 모두 실행할 수 있게 되었다. 

다음 목표로는 서비스의 downtime 없이 업데이트 및 배포를 진행할 수 있도록 해보는 것을 시도해 보아야겠어...
