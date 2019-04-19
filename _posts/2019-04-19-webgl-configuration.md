---
layout: post
title: "작업환경 설정"
---
## [WebGL] 00. 작업환경 설정

이 튜토리얼 시리즈는 WebGL 2.0 버전을 기반으로 하고 있습니다. 또, 개발 과정에서 Typescript와 webpack을 사용하고 있습니다.

### NPM Package

먼저 콘솔에서 필요한 package들을 설치합니다. Tyescript와 webpack은 개발 과정에서만 필요하고 빌드된 버전에서는 필요하지 않기 때문에 --save-dev 옵션으로 설치해 줍니다.

```
$ npm init
$ npm install --save-dev typescript ts-loader webpack webpack-cli @types/webgl2
```

### HTML 및 CSS 파일 작성

WebGL에서 활용할 Canvas element를 담은 HTML 페이지를 만들어 보겠습니다. 작업할 디렉토리에 index.html 파일을 작성해 주세요.

여기에서 \<canvas>는 WebGL이 작동할 공간이며, ./dist/bundle.js 는 webpack을 통해 우리가 작성한 모든 코드가 묶일 script입니다.

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

### Webpack 설정하기

Webpack은 Javscript 어플리케이션에서 require, import 등 서로 의존 관계가 있는 여러 개의 파일을 하나로 bundling해주기 위해 사용합니다.

이 튜토리얼에서는 Typescript를 사용하기 때문에, .ts 확장자를 가진 파일들을 Javascript로 로드하고 묶어 ./dist/bundle.js 파일로 합쳐줄 것입니다. webpack.config.js 파일을 생성하고 다음 내용을 작성합니다.

```
var path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/main.ts',
    output: {
        filename: 'bundle.js',
        path: __dirname + '/dist'
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: '/node_modules'
            }
        ]
    },
    resolve: {
        extensions: ['.ts'],
        modules: [
            path.resolve('./src'),
            './node_modules'
        ]
    }
}
```

Entry file은 src/main.ts로, output file은 dist/bundle.js로 설정합니다. 이 output file은 앞서 작성한 index.html에서 참조하고 있습니다. 또한, Typescript로 작성된 파일을 불러오기 위해 module과 resolve property에 관련 내용을 추가해 줍니다. Webpack에 대한 더 자세한 설명은 아래 링크를 참조하시기 바랍니다.

> [Webpack 더 알아보기](https://webpack.js.org/concepts)

### Typescript 설정하기

tsconfig.json 파일을 생성하고 다음 내용을 작성합니다. 이 파일은 ts-loader 모듈이 Typescript 코드를 Javascript로 번역할 때 참조할 설정들을 담고 있습니다.

```
{
    "compilerOptions": {
        "outDir": "./dist/",
        "noImplicitAny": true,
        "module": "es6",
        "target": "es5",
        "allowJs": true
    }
}
```

### Webpack으로 bundling하기

이제 entry file로 설정한 src/main.ts 파일을 작성해 줍니다. 지금은 단순히 콘솔 창에 Hello, world!만 출력하는 코드로 작성하겠습니다.

```
console.log('Hello, world!');
```

다음으로는 package.json 파일의 다음 부분을 수정해 줍니다.
이를 통해 "npm run build" 명령으로 webpack에게 bundling을 시키는 명령인, "webpack --config webpack.config.js"을 대신 수행할 수 있습니다.

```
{
    ...,
    "scripts": {
        ...,
        "build": "webpack --config webpack.config.js"
    },
    ...
}
```

이제 다음 명령을 콘솔에서 실행하면 dist/bundle.js 파일이 생성된 것을 볼 수 있습니다.

```
$ npm run build
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

![preview]({{site.url}}/images/00-configuration-preview.PNG)

### 링크

[GitHub Repository](https://github.com/inhibitor1217/webgl-tutorials/tree/master/tutorials/00-configuration)
