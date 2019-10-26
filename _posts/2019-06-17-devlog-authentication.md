---
layout: post
title: "매번 구현하는 회원인증과 로그인"
tags: [web]
---

## 회원인증과 로그인

사이드 프로젝트로 개발하는 서비스 대부분에서 구현해야 하는데 매번 같은 것들을 찾아보면서 시간을 쓰는 것이 싫어서 여러 링크들과 관련 지식을 한 번에 정리해 보았다.

<!--more-->

### 데이터베이스
관계형 데이터베이스든 NoSQL이든 서비스를 사용하는 회원들의 정보(이름, 이메일, **비밀번호** 등등)를 저장해야 하고, 이를 API 서버에서 열람하여 들어오는 요청들을 처리해야 한다.

#### DB 인증
아무리 프론트와 백엔드에서 보안을 철저히 했다고 하더라도 DB 자체가 뚫려 데이터가 노출될 가능성이 있기 때문에 먼저 데이터베이스를 안전하게 보호해야 한다. 회원인증 뿐만이 아니라 모든 데이터베이스에 적용되는 사항이다.

SQL 기반 DB들(MySQL, MariaDB, PostgreSQL 등)은 데이터베이스에 접속 시 인증을 요구하는 것이 기본이다. 그리고 DB의 user마다 사용할 수 있는 쿼리의 종류를 설정할 수 있다. 그러니까 DB의 root user는 개발할 때만 쓰고, API 서버에서 사용하는 계정이 노출될 가능성에 대비하여 이 계정에는 필요한 권한만 주는 것이 바람직하다.

> SQL 데이터베이스 DB 계정 설정
> - 생성: `CREATE USER IF NOT EXISTS [username] IDENTIFIED BY [password];`
>   - [MariaDB Docs - Create User](https://mariadb.com/kb/en/library/create-user/)
> - 권한 확인: `SHOW GRANTS FOR [username];`
>   - [MariaDB Docs - Show Grants](https://mariadb.com/kb/en/library/show-grants/)
> - TABLE 권한 부여: `GRANT [privileges] ON TABLE [db_name].[table_name] TO [username];`
>   - Privileges
>       - `ALL PRIVILEGES`: 모든 권한
>       - `DROP, SELECT, INSERT, UPDATE, DELETE` 등 statement 실행 권한을 설정 가능
>   - `db_name`, `table_name`에 `*` 와일드카드 적용 가능
>   - [MariaDB Docs - Grant](https://mariadb.com/kb/en/library/grant/)

MongoDB는 따로 설정을 해주지 않으면 **authentication 없이 DB에 접속할 수 있는 대신 localhost에서만 접속이 가능하다.** 외부에서 접속을 허용하면 당연히 보안 문제가 생기기 때문에 인증 모드로 설정하여 DB를 운용해야 한다.

> [MongoDB Docs - Enable Authentication](https://docs.mongodb.com/manual/tutorial/enable-authentication/)

### JWT 기반 인증

JSON Web Token (JWT)를 통해 JSON 객체를 적절한 hash algorithm을 통해 변환하여 정보를 두 개체 사이에서 안전하고 (= **confidentiality**) 완전하게 (= **integrity**) 전달할 수 있다.

> [velopert.com - JSON Web Token 소개 및 구조](https://velopert.com/2389)

Node.js 기반 백엔드 서버 개발이라면 JWT 기반 시스템을 NPM module `jsonwebtoken`을 통해 구축할 수 있다.

> [npm - jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)

매번 똑같이 쓰는 함수들을 정리해 보았다.

```javascript
import jwt from 'jsonwebtoken';

const { JWT_SECRET: secret } = process.env; // Private key, should be kept secret

/**
 * Generates a JSONWebToken using the payload and the options.
 * The secret key is pre-determined from environmental variables.
 * @param {object} payload The data to encode.
 * @param {object} options Available fields: algorithm, expiresIn, notBefore, audience, issuer, jwtid, subject, noTimestamp, header, keyid
 * @returns {string} A promise which handles the encoded JSONWebToken in the callback.
 */
export const generateToken = (payload, options) => {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            secret,
            {
                issuer: 'api.service.com', // 서비스 제공자
                expiresIn: '1d',           // JWT 만료 기한
                ...options
            },
            (err, encoded) => {
                if (err)
                    reject(err);
                else
                    resolve(encoded);
            }
        );
    });
};

/**
 * Verifies if a given JSONWebToken is valid using the private key.
 * @param {string} token JSONWebToken to verify.
 * @param {object} options Available fields: algorithms, audience, complete, issuer, ignoreExpiration, ignoreNotBefore, subject, clockTolerance, maxAge, clockTimestamp, nonce
 * @returns {object} A promist which handles the decoded object in the callback.
 */
export const verifyToken = (token, options) => {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            secret,
            {
                issuer: 'api.service.com', // 서비스 제공자
                maxAge: '1d',              // JWT 만료 기한
                ...options
            },
            (err, decoded) => {
                if (err)
                    reject(err);
                else
                    resolve(decoded);
            }
        )
    })
}
```

나는 보통 API 서버의 로그인 엔드포인트에서 JWT를 발급하는 `generateToken`을 통해 클라이언트 브라우저에 **쿠키**에 발급된 토큰을 저장한다. 이후 클라이언트가 인증이 필요한 API에 접근하면, request에 포함된 쿠키를 함께 전송하여 (이후 CORS 섹션 참조!) 이를 `verifyToken`으로 확인한다. JWT에는 payload도 담길 수 있으니 user 관련 정보(username, id 등)를 넣어놓을 수도 있다. 엔드포인트마다 이걸 설정하기 귀찮으니 보통 middleware에서 처리한다.

```javascript
// Koa.js based middleware
async (ctx, next) => {
    
    const accessToken = ctx.cookies.get('access_token');
    if (!accessToken) {
        ctx.request.user = null;
        return next();
    }
    await verifyToken(accessToken)
        .then(async (decoded) => {
            const { iat, exp, iss, ...user } = decoded;
            /* Reassign JWT if expiration is approaching */
            if (exp - Date.now() / 1000 < 60 * 60 * 3) {
                const newToken = await generateToken(user);
                ctx.cookies.set('access_token', newToken, {
                    httpOnly: true,
                    maxAge: 1000 * 60 * 60 * 24
                });
            }
            ctx.request.user = user;
        })
        .catch((err) => {
            ctx.request.user = null;
        });

    return next();

}
```

### 아이디, 이메일, 비밀번호 점검

보통 우리가 접하는 서비스들에서는 회원가입할 때 아이디나 비밀번호를 "알파벳과 숫자", "6자 이상의 알파벳, 숫자, 특수문자" 등의 조건을 붙여서 만들 것을 요구하는 경우가 많다. ASCII 문자열 내에서 처리하기 위한 것도 있고 문자열을 조작해서 DB를 SQL Injection 같은 것으로 뚫는 것을 막으려고 그런 것도 있고.. 다양한 이유가 있겠지만, 이것을 쉽게 처리할 수 있는 NPM Module로 `joi`라는 것이 있다.

> [npm - joi](https://www.npmjs.com/package/@hapi/joi)

```javascript
/* Validate request body schema */
const schema = Joi.object().keys({
    username: Joi.string().min(1).max(12).regex(/^[A-Za-z0-9가-힣]*$/).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(30).regex(/^[A-Za-z0-9!@#$%\^&\*]*$/).required()
});
const validationResult = Joi.validate(req.body, schema);
if (validationResult.error) {
    // handle error
}
```

API 서버라면 400 Bad Request reponse를 반환하고, 프론트엔드라면 API 요청을 생략하고 화면에 에러 메시지를 띄우면 되지 않을까?

복잡한 비밀번호("8자 이상, 대문자와 소문자, 숫자, 특수문자를 포함하는 비밀번호" 같은 형태)인지 체크하는 것은 joi의 문법을 사용해서 할 수도 있겠지만 regex로 하는 것이 역시 속 편하다.

> [stackoverflow - 비밀번호 regex 관련 질문 & 좋은 답변](https://stackoverflow.com/questions/19605150/regex-for-password-must-contain-at-least-eight-characters-at-least-one-number-a)

### Cross Origin 처리 (CORS)

여기까지 구현했다면, 브라우저 쿠키에 토큰을 넣어서 인증을 하려고 했더니 브라우저 콘솔에서 CORS 관련 에러가 뜰 것이다. 

CORS (Cross-Origin Resource Sharing)은 cross-Site HTTP request에 관한 규칙이다. 보통 HTTP reqeust를 보낼 때는 다른 도메인의 리소스를 자유롭게 가져오는 것이 가능하다. 그런데 ajax 등으로 javascript 스크립트에서 cross-site (= 다른 도메인) request를 보내는 것을 불가능하다! 그래서 이걸 가능하게 해 주는 프로토콜이 CORS라고 생각하면 되겠다...

> CORS 관련 링크
> - [설명이 어려운 Doc](https://developer.mozilla.org/ko/docs/Web/HTTP/Access_control_CORS)
> - [괜찮은 글 1](https://homoefficio.github.io/2015/07/21/Cross-Origin-Resource-Sharing/)
> - [괜찮은 글 2](https://www.popit.kr/cors-preflight-%EC%9D%B8%EC%A6%9D-%EC%B2%98%EB%A6%AC-%EA%B4%80%EB%A0%A8-%EC%82%BD%EC%A7%88/)

대부분의 서버 프레임워크에서는 CORS를 해결할 수 있는 module이 만들어져 있다. Express.js에서는 NPM `cors` module을 사용할 수 있다.

> [npm - cors](https://www.npmjs.com/package/cors)

지금 서비스 개발에 쓰고 있는 Koa.js에서는 `@koa/cors` module을 사용한다.

> [npm - @koa/cors](https://www.npmjs.com/package/@koa/cors)

Access-Control-Allow-Origin, Access-Control-Allow-Credentials, Access-Control-Allow Methods와 같은 response header를 잘 설정하자.