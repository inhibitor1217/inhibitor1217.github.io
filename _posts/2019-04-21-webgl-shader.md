---
layout: post
title: "04-1. 그래픽스 파이프라인, Shader, GLSL"
tags: [webgl, shader]
---
> [WebGL 튜토리얼 목록]({{site.url}}/1_webgl-tutorials)

이번 튜토리얼에서는 [전 튜토리얼]({{site.url}}/2019/04/20/webgl-vao)에서 그냥 넘어갔던 코드가 무슨 일을 하는지 자세히 다뤄보도록 하겠습니다. 

<!--more-->

```typescript
const vertexShaderSource = 
`#version 300 es
layout(location = 0) in vec2 position;
void main() {
    gl_Position = vec4(position, 0, 1);
}
`
const fragmentShaderSource = 
`#version 300 es
precision mediump float;
out vec4 out_color;
void main() {
    out_color = vec4(1, 1, 1, 1);
}
`
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

gl.useProgram(program);
```

이 튜토리얼에서 다루는 내용은 OpenGL과 WebGL 모두 적용되는 내용입니다. 단, OpenGL은 일반 GLSL을 사용하고 WebGL은 GLSL ES를 사용해서 두 버전이 서로 다르다는 점에 유의하시기 바랍니다.

> [참고: OpenGL, WebGL 버전과 GLSL 버전](https://en.wikipedia.org/wiki/OpenGL_Shading_Language#Versions)

## 그래픽스 파이프라인 (Graphics Pipeline)

> [OpenGL Wiki - Rendering Pipeline Overview](https://www.khronos.org/opengl/wiki/Rendering_Pipeline_Overview)

**파이프라인**이란 데이터를 여러 단계에 걸쳐 차례로 처리하는 방식을 의미합니다. 마치 공장에서 컨베이어 벨트를 따라 자재가 움직이고 순서에 따라 조립, 도색 등의 작업이 진행되는 것을 상상하시면 되겠습니다. 파이프라인을 통해 작업을 처리하면, 어떤 step에서 데이터가 처리되는 동안 다른 step에서 다른 데이터를 처리할 수 있습니다. 따라서, 하나의 데이터가 시스템 전체를 통과하는 시간은 변하지 않지만, 많은 양의 데이터를 효율적으로 처리할 수 있습니다.

VAO는 모델의 vertex가 가지고 있는 데이터의 형식을 정의하고, VBO는 실제 데이터를 가지고 있으며, IBO는 vertex가 서로 어떻게 연결되어 삼각형과 같은 primitive를 만드는지 정의합니다. GPU는 VAO, VBO, IBO에 담긴 정보를 **그래픽스 파이프라인**(Graphics Pipeline)을 거쳐 처리하고, 최종 결과를 화면에 표시합니다.

## Shader

> [OpenGL Wiki - Shader](https://www.khronos.org/opengl/wiki/Shader)

맨 처음 OpenGL 버전에서는 파이프라인의 각 step에서 어떤 일을 하는지 고정되어 있고, 어플리케이션에서는 여러 가지 설정을 바꾸는 것만 가능했습니다. 하지만, 꽤 오래 전부터 OpenGL은 파이프라인의 일부 부분을 **직접 프로그래밍**하는 것을 지원하고 있습니다. (데이터가 흘러가는 컨베이어 벨트에서 일부 기계를 직접 설계해서 끼워넣는 것입니다.) 파이프라인에서 사용자가 직접 설계할 수 있는 부분을 **shader**라고 부릅니다.

물론, 끼워넣을 수 있는 자리가 정해져 있고 파이프라인의 (고정된) 다른 부분과 연계되어야 하기 때문에 제약이 있습니다만, shader를 잘 다룰 줄 알면 충분히 많은 것들을 구현할 수 있습니다.

### Vertex Shader, Fragment Shader

그래픽스 파이프라인은 OpenGL이 발전하면서 계속 복잡해져 왔고, 여러 가지 step으로 구성되어 있습니다. 여기에서는 가장 기본이 되는 step들과 우리가 프로그래밍할 수 있는 shader가 어디에 들어갈 수 있는지만 다뤄보도록 하겠습니다.

![pipeline]({{site.url}}/images/2019-04-21-webgl-shader/pipeline.png)

- Vertex shader는 파이프라인의 가장 첫 부분으로, VAO와 VBO에 들어있는 데이터를 입력으로 받습니다. Vertex Shader는 각 vertex마다 한 번씩 실행되고, 한 vertex를 처리할 때 다른 vertex에 관한 정보는 접근할 수 없습니다. Vertex shader에서 내보내는 출력은 직접 정할 수 있으며, 이 출력이 그대로 fragement shader의 입력으로 들어옵니다. 또, vertex shader에서 `gl_Position`이라는 고정된 변수를 출력으로 내보냅니다.
- 필수는 아니지만, Vertex shader에서 처리한 입력을 추가로 처리할 수 있습니다. Tessellation shader와 Geometry shader를 사용하면 되는데, 지금은 다루지 않도록 하겠습니다.
- 이제 vertex shader에서 내보낸 각 vertex의 `gl_Position` 변수를 처리하는 고정 step을 거칩니다. Clipping 단계에서는 `gl_Position`을 보고 이 vertex가 화면 안에 존재하는지 판단합니다. 화면 밖에 있다면 굳이 처리할 필요가 없겠죠.
- 다음으로는 vertex들을 서로 연결하여 점, 선, 삼각형과 같은 primitive을 만든 후, **rasterization**이라는 단계를 거칩니다. 쉽게 이해하기 위해 우리가 선을 그리고 있다고 생각합시다. Vertex shader에서는 2개의 끝점 vertex를 처리하여 넘겨줍니다. 하지만, 화면에는 끝점만 그리는 것이 아니라 점을 연결하는 선상의 픽셀들도 그려야 하겠죠? Rasterization을 할 때 어떤 픽셀들이 사이에 있는지 판단하여 다음 step으로 넘겨줍니다. 
- 이 과정에서 interpolation을 진행합니다. Vertex shader에서 출력으로 `x`라는 값을 내보낸다고 합시다. 선분의 한 끝점은 `x=0`, 다른 끝점은 `x=1` 이라고 하면, 그 절반 지점에 있는 픽셀은 `x=0.5`, 1/4 지점에 있는 픽셀은 `x=0.25` 값을 가지도록 interpolation됩니다.
- Fragment shader는 각 픽셀에 대해 한 번씩 실행됩니다. Vertex shader에서 출력으로 지정한 변수들이 입력으로 들어오며, 그 값은 vertex들에 지정된 값들이 interpolate된 값입니다. Fragment shader에서 출력으로 지정한 변수가 최종적으로 화면에 표시되는 픽셀의 색깔입니다.

### GLSL

>  [OpenGL Wiki - OpenGL Shading Language](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)

GLSL은 OpenGL Shading Language의 줄임말로, 그래픽스 파이프라인에 끼워넣을 수 있는 shader를 직접 프로그래밍하는 데 쓰이는 프로그래밍 언어입니다. C와 매우 비슷하기 때문에 따로 언어를 공부할 필요는 없습니다. 미리 정의된 built-in 함수들과 키워드들만 알면 충분합니다.

우리가 전 튜토리얼에서 작성한 코드에서 `vertexShaderSource`, `fragmentShaderSource` 에 코드처럼 생긴 `string`을 담았습니다. 이것이 바로 GLSL로 작성된 shader 코드입니다.

```GLSL
#version 300 es
layout(location = 0) in vec2 position;
void main() {
    gl_Position = vec4(position, 0, 1);
}
```

```GLSL
#version 300 es
precision mediump float;
out vec4 out_color;
void main() {
    out_color = vec4(1, 1, 1, 1);
}
```

- 맨 첫 줄에는 GLSL의 버전을 지정합니다. WebGL 2.0에서는 GLSL ES 3.00 버전을 사용하기 때문에 이를 가리키는 `#version 300 es`를 적어줍니다.
- Shader의 입력과 출력은 `in`과 `out` 키워드로 지정합니다.
    - Vertex shader 코드는 `vec2` 타입의 `position`을 입력으로 받습니다. (직사각형의 vertex attribute로 각 vertex의 2차원 좌표를 VBO에 담았던 것 기억하시죠?) 그리고, 출력으로는 고정된 변수인 `gl_Position`을 `main()` 함수 내에서 계산합니다. 2차원 좌표인 `position`을 *3차원 동차 좌표 (homogenous coordinate)*, 즉 4차원 벡터로 바꾸어 줍니다. 
    - Fragment shader 코드는 출력 변수인 `out_color`를 하얀색`(1, 1, 1, 1)`으로 설정합니다. 즉, 직사각형 내부에 속한 모든 픽셀을 하얀색으로 설정하는 코드입니다.
    - Vertex shader의 출력 변수가 fragment shader의 입력 변수로 들어오기 때문에, 두 변수의 이름과 타입이 정확히 똑같아야 합니다. 즉, vertex shader에서 `out vec4 x;`와 같이 출력 변수를 설정하면, fragment shader에는 `in vec4 x;`로 적어야 합니다. 올바르게 적지 않으면 나중에 link할 때 에러가 납니다.
- Vertex shader에서 입력을 받을 때, `layout(location = 0)`와 같은 선언은 이 입력 변수가 몇 번 vertex attribute에 해당되는지 표시하는 키워드입니다. 앞서 `Mesh` 클래스를 작성할 때, 0번부터 차례로 vertex attribute를 배정했었기 때문에, vertex의 위치가 0번 vertex attribute에 들어있고, 이를 vertex shader에서 받을 수 있습니다. 
- Fragment shader의 `precision medium float`은 `float`의 정확도를 설정하는 부분으로, 크게 중요하지는 않습니다.

## WebGL에서 shader 사용하기

WebGL에서 GLSL 코드를 컴파일하고, vertex shader와 fragment shader를 link하여 파이프라인에 등록하는 API들입니다.

```typescript
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);
```


Shader들을 모두 컴파일했으면, 이제 vertex shader와 fragment shader를 link하여 하나의 파이프라인을 만듭니다. WebGL에서는 이 파이프라인을 program이라고 부릅니다.

```typescript
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
```
완성한 프로그램은 `gl.useProgram(program)`을 통해 bind할 수 있습니다. 나중에 `gl.drawArrays`와 같이 렌더링하는 API를 호출할 때 bind된 프로그램이 사용됩니다.

이렇게 앞 튜토리얼에서 적었던 코드가 무슨 뜻이었는지 알아보았습니다. 다음 튜토리얼에서는 shader와 program 관련 API들을 추상화하여 감싸는 클래스를 만들어 엔진에 추가하도록 하겠습니다.