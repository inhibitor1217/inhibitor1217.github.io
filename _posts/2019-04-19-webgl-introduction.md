---
layout: post
title: "WebGL 소개, 스택, OpenGL과 비교"
---
## [WebGL] WebGL 소개, 스택, OpenGL과 비교

> [WebGL 튜토리얼 목록]({{site.url}}/2019/04/19/webgl-tutorials)

![webgl_logo]({{site.url}}/images/WebGL_100px_June16_180_75.png)

### 그래픽스 라이브러리?

많은 개발자들이 Unity나 Unreal Engine과 같은 게임 엔진을 활용하여 자신만의 게임을 만듭니다. 게임 엔진은 게임 개발의 입문 난이도를 엄청나게 낮춰주지만, 그만큼 게임 엔진만을 다루며 개발하면 엔진 속에서 어떤 일이 일어나는지 *behind the scenes* 알기 어렵습니다. 또한 멋있어 보이는 효과를 연출하고 싶거나, 최적화를 하고 싶다면 게임 엔진 내에서 어떠한 작업이 이루어지는지 반드시 알아야 합니다.

그래픽스 라이브러리(Graphics Library)는 사용자가 원하는 그림을 화면에 표시하는 것을 담당하는 라이브러리입니다. 모든 게임 엔진 내에 내장되어 있으며, 대부분 GPU를 통해 효율적으로 작업을 수행합니다. OpenGL, DirectX 등이 대표적인 그래픽스 라이브러리입니다.

### WebGL

WebGL은 OpenGL을 기반으로 하고 있습니다. OpenGL과 마찬가지로 Khronos Group에서 관리하는 오픈 소스 라이브러리입니다. Khronos Group에서는 다음과 같이 소개하고 있습니다.

> WebGL is a cross-platform, royalty-free web standard for a low-level 3D graphics API based on OpenGL ES, exposed to ECMAScript via the HTML5 Canvas element. Developers familiar with OpenGL ES 2.0 will recognize WebGL as a Shader-based API using GLSL, with constructs that are semantically similar to those of the underlying OpenGL ES API. It stays very close to the OpenGL ES specification, with some concessions made for what developers expect out of memory-managed languages such as JavaScript. WebGL 1.0 exposes the OpenGL ES 2.0 feature set; WebGL 2.0 exposes the OpenGL ES 3.0 API.  
WebGL brings plugin-free 3D to the web, implemented right into the browser. Major browser vendors Apple (Safari), Google (Chrome), Microsoft (Edge), and Mozilla (Firefox) are members of the WebGL Working Group.  
출처: [https://www.khronos.org/webgl/](https://www.khronos.org/webgl/)

요약하면,

- 브라우저의 **HTML 5 Canvas element** 위에 화면을 그려냅니다.
    - **Javascript**를 사용합니다. Javascript는 garbage collection을 수행하기 때문에 low-level 언어인 C, C++의 OpenGL과는 조금 다를 수 있습니다.
    - 브라우저에 따라 WebGL (WebGL2) 지원 여부가 서로 다릅니다. 단, 지원하는 브라우저에 대해서는 동일한 코드로 같은 결과를 얻을 수 있습니다.
        - [WebGL, WebGL 2 지원 브라우저](https://caniuse.com/#feat=webgl)
- WebGL 2는 OpenGL ES 3.0 버전을 기반으로 하고 있습니다. Shader의 경우 GLSL ES 3.00 버전을 사용합니다.

제가 생각하는 WebGL의 장점은 다음과 같습니다.

- Javscript와 브라우저, HTML을 사용하기 때문에...
    - NPM module을 자유롭게 이용할 수 있습니다.
    - React, Vue와 같은 프론트엔드 라이브러리와 함께 이용할 수 있습니다.
    - OpenGL 등 게임 엔진에서 직접 구현해야 하는 버튼 등의 UI element를 HTML의 지원을 받아 쉽게 추가할 수 있습니다.
    - 멀티플레이어 게임 등 네트워킹이 필요한 어플리케이션의 경우, 이미 관련 module이 많고 브라우저의 지원 또한 이용할 수 있습니다.

### WebGL 개발

Javscript와 그래픽스 라이브러리 관련한 경험이 있으면 편하게 개발할 수 있습니다. WebGL의 documentation을 보면 OpenGL 3.0의 API를 Javscript에 맞게 번역한 형태로 쓰여져 있다는 사실을 알 수 있습니다. 따라서, 대부분의 경우 OpenGL application을 만들 듯 하면 되지만, 메모리 관리나 네트워킹, 파일 입출력 등에서 차이가 있습니다. 이 부분 관련해서는 브라우저, Web application 관련 지식이 필요할 것 같습니다.

### API Documentation

- [WebGL 1.0](https://www.khronos.org/registry/webgl/specs/latest/1.0/)
- [WebGL 2.0](https://www.khronos.org/registry/webgl/specs/latest/2.0/)

### 링크

- [Khronos Group 공식 사이트](https://www.khronos.org/webgl/)
- [GitHub Repository](https://github.com/KhronosGroup/WebGL)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [WebGL 2 Fundamentals](https://webgl2fundamentals.org/)