---
layout: post
title: "Display (Canvas, Viewport)"
---
## [WebGL] 01. Display (Canvas, Viewport)

OpenGL이나 DirectX와 같은 그래픽 라이브러리는 화면을 출력할 window를 OS에게 요청합니다. 그러나, WebGL은 HTML Canvas element를 사용하기 때문에 canvas의 rendering context를 불러오는 것으로 간단히 화면을 생성할 수 있습니다.

### Canvas에서 Rendering Context 불러오기

src/main.ts에 다음 코드를 적어주세요. NPM의 @types/webgl2 module을 제대로 설치했다면, WebGL2RenderingContext라는 type이 문제 없이 컴파일 될 것으로 예상됩니다.

```
const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('canvas');
const gl: WebGL2RenderingContext = canvas.getContext('webgl2');
```

먼저 document.getElementById를 통해 index.html에서 생성한 canvas element를 불러옵니다. 그리고, 그 canvas의 rendering context 중 우리가 이용할 WebGL 2의 context를 가져옵니다.

WebGL 2를 지원하지 않는 브라우저(IE, Edge)의 경우 canvas.getContext('webgl2')가 null을 리턴할 것입니다. 예외처리를 적절히 해주시기 바랍니다.

### Global 변수 설정

방금 가져온 gl은 전체 코드에서 사용할 것이기 때문에 전역변수로 설정하는 것이 편리하나, 전역변수를 직접 사용하는 것은 여러모로 문제가 있습니다. 그래서 전역변수(처럼 이용할 것들)을 담아놓는 모듈을 만들도록 하겠습니다.

src/global.ts에 다음 내용을 작성하세요.

```
export default (
    () => {
        const st: {[key: string]: string} = window.localStorage || {};
        return {
            set: (key: string, object: any): void => {
                st[key] = (typeof object) === 'string' ? object : JSON.stringify(object);
            },
            get: (key: string): any => {
                const value = st[key];
                if (!value)
                    return null;
                try {
                    const object = JSON.parse(value);
                    return object;
                } catch(e) {
                    return value;
                }
            },
            remove: (key: string): void => {
                if (window.localStorage)
                    window.localStorage.removeItem(key);
                else
                    delete st[key];
            }
        }
    }
)();
```

이 모듈은 IIFE(Immediately Invoked Function Expression, 즉시 실행 함수 표현)를 사용하여 global scope를 오염시키지 않고 get, set을 통해 전역변수로 이용할 object들을 저장하고 가져올 수 있도록 해줍니다.

다시 src/main.ts에서 이 모듈을 import하고, gl을 전역변수로 저장합니다.

```
import global from 'global';
...
if (gl) {
    global.set('gl', gl);
    ...
}
...
```

이제 다른 파일에서도 똑같이 global을 불러온 후 global.get('gl')을 통해 WebGL rendering context에 접근할 수 있게 되었습니다.

### Viewport

그래픽스 라이브러리에서 **viewport**란 전체 window에서 실제로 화면이 그려질 직사각형 영역을 의미합니다. 보통의 경우 window 전체가 되지만, window의 일부에만 렌더링 하는 것도 가능합니다.

Viewport의 좌표계(**Device Coordinates**)는 오른쪽 위 꼭짓점을 (1, 1), 왼쪽 아래 꼭짓점을 (-1, -1)로 하는 2차원 좌표입니다. 이러한 좌표계의 개념은 나중에 그래픽스 파이프라인(Graphics Pipeline)을 다룰 때 중요합니다만, 지금은 이 좌표계만 알면 충분합니다.

WebGL에서 viewport는 다음과 같이 설정할 수 있습니다.
```
gl.viewport(x, y, width, height)
```
(x, y)는 전체 window에서 viewport의 왼쪽 아래 좌표이며, width와 height는 viewport의 너비와 높이입니다. Canvas 전체를 viewport로 하는 경우에는 다음과 같이 쓰면 됩니다.
```
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
```

### 버퍼 초기화

사람의 눈은 60fps, 즉 1/60초에 한 번 전체 화면을 다시 그립니다. 한 번 화면을 그리기 위해서 각 픽셀의 데이터를 담은 버퍼를 초기화한 후 모든 물체를 다시 그려야 합니다. 여기에서 **버퍼를 초기화**하는 API가 gl.clear입니다.

gl.clear는 어떤 버퍼를 초기화 할 것인지를 인자로 받습니다. 버퍼에도 여러 종류가 있는데, 이 부분에 대해서는 나중에 자세히 다루도록 하겠습니다. 지금은 각 픽셀의 색을 담는 버퍼인 color buffer를 초기화하면 됩니다.

main.ts에 다음 코드를 작성하세요.

```
...
if (gl) {
    ...
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    ...
}
...
```

먼저 gl.clearColor를 통해 버퍼를 무슨 값으로 초기화할지 정해줍니다. 색깔 (r, g, b, a) = (0, 0, 0, 1)은 검은색이니, 전체 화면이 검은색으로 초기화됩니다. (a는 alpha, 투명도 값입니다.) 그 후, gl.clear를 통해 버퍼를 초기화합니다.

### 실행 결과

http-server로 로컬 서버를 켜고 localhost:8080에 접속하면 다음과 같은 결과를 볼 수 있습니다. 브라우저가 WebGL 2를 지원하는지 확인해 주세요.

![preview]({{site.url}}/images/01-display-preview.png)

gl.clearColor의 색을 바꾸면 화면이 다른 색깔로 변하는지도 확인해 보세요.

### 링크

[GitHub Repository](https://github.com/inhibitor1217/webgl-tutorials/tree/master/tutorials/01-display)