## [WebGL] 00. 작업환경 설정

이 튜토리얼 시리즈는 WebGL 2.0 버전을 기반으로 하고 있습니다. 또, 개발 과정에서 Typescript와 webpack을 사용하고 있습니다.

### NPM Package

먼저 콘솔에서 필요한 package들을 설치합니다. Tyescript와 webpack은 개발 과정에서만 필요하고 빌드된 버전에서는 필요하지 않기 때문에 --save-dev 옵션으로 설치해 줍니다.

```
$ npm init
$ npm install --save-dev typescript ts-loader webpack webpack-cli @types/webgl2
```

### HTML 및 CSS 파일 작성

WebGL에서 활용할 Canvas element를 담은 HTML 페이지를 만들어 보겠습니다. 작업할 디렉토리에 index.html 파일을 작성해 주세요. 여기에서 \<canvas>는 WebGL이 작동할 공간이며, ./dist/bundle.js 는 webpack을 통해 우리가 작성한 모든 코드가 묶일 script입니다.

```
<!DOCTYPE html>
<html>
    <head>
        <meta charset=utf-8>
        <title>Tutorial 00 - Configuration</title>
        <link rel="stylesheet" type="text/css" href="./style.css" />
    </head>
    <body>
        <h1>WebGL Tutorial 0 - Configuration</h1>
        <p>inhibitor</p>
        <canvas id="canvas" width=1024 height=768></canvas>
        <script src="./dist/bundle.js"></script>
    </body>
</html>
```

그리고 style.css 파일 또한 작성합니다. index.html이나 style.css 파일은 원하는 대로 변경하셔도 상관 없습니다.

```
@import url(http://fonts.googleapis.com/css?family=Ubuntu);

html, body {
    width: 100%;
    height: 100%;
}

body { 
    background-color: #151515;
    margin: 0;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

canvas {
    width: 800px;
    height: 600px;
}

h1, p {
    font-family: 'Ubuntu';
}

h1 {
    color: #AEAEAE;
    font-size: 36px;
}

p {
    color: #505050;
    font-size: 18px;
}
```

### 로컬 서버 실행해 보기

완성된 페이지에 접속하기 위해 http-server 모듈을 사용합니다. 다음 명령을 통해 http-server를 설치해 주세요.

```
$ npm install --global http-server
```

이제 다음 명령을 통해 HTTP 서버를 열어줍니다. (-c-1 옵션은 브라우저의 cache 옵션을 비활성화해 우리가 갱신한 파일을 바로 볼 수 있도록 합니다.)

```
$ http-server -c-1
```

이제 브라우저를 켜고 localhost:8080 주소에 접속하면 다음과 같은 화면이 표시되는 것을 볼 수 있습니다.