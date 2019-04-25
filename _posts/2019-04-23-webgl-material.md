---
layout: post
title: "[WebGL] 04-2. Uniform Variables, Material"
---
## Uniform Variables, Material

> [WebGL 튜토리얼 목록]({{site.url}}/webgl-tutorials)

이번 튜토리얼에서는 shader를 다루는 WebGL API들을 감싸는 클래스들을 만들어 엔진에 추가합니다. `src/engine/` 디렉토리 내에 `components/Material.ts` 파일과 `shaders/Program.ts` 파일을 생성하세요.

<!--more-->

```
.
├── src
│   ├── engine
│   │   ├── components
│   │   │   ├── Mesh.ts
│   │   │   └── Material.ts
│   │   └── shaders
│   │       └── Program.ts
│   ├── main.ts
│   └── global.ts
├── index.html
├── style.css
...
```
### Program 클래스

`src/engine/` 디렉토리 내의 `shaders/Program.ts` 파일에서 작업합니다.

GLSL 소스 코드를 컴파일, link하여 WebGL 프로그램으로 만드는 과정은 굳이 나눌 필요 없이 생성자에서 처리하는 것이 편리합니다. 아래 코드는 GLSL 코드에 오류가 있을 경우를 고려하여 컴파일이나 link 과정에서의 error-handling도 포함하고 있습니다.

```typescript
constructor(vertexShaderSource: string, fragmentShaderSource: string) {
    this._gl = global.get('gl');

    this._vertexShader = this._gl.createShader(this._gl.VERTEX_SHADER);
    this._gl.shaderSource(this._vertexShader, vertexShaderSource);
    this._gl.compileShader(this._vertexShader);
    if (!this._gl.getShaderParameter(this._vertexShader, this._gl.COMPILE_STATUS)) {
        this._gl.deleteShader(this._vertexShader);
        console.log(this._gl.getShaderInfoLog(this._vertexShader));
        throw "Error occurred while compiling vertex shader";
    }

    this._fragmentShader = this._gl.createShader(this._gl.FRAGMENT_SHADER);
    this._gl.shaderSource(this._fragmentShader, fragmentShaderSource);
    this._gl.compileShader(this._fragmentShader);
    if (!this._gl.getShaderParameter(this._fragmentShader, this._gl.COMPILE_STATUS)) {
        this._gl.deleteShader(this._vertexShader);
        this._gl.deleteShader(this._fragmentShader);
        console.log(this._gl.getShaderInfoLog(this._fragmentShader));
        throw "Error occurred while compiling fragment shader.";
    }

    this._program = this._gl.createProgram();
    this._gl.attachShader(this._program, this._vertexShader);
    this._gl.attachShader(this._program, this._fragmentShader);
    this._gl.linkProgram(this._program);
    if (!this._gl.getProgramParameter(this._program, this._gl.LINK_STATUS)) {
        this._gl.deleteProgram(this._program);
        this._gl.deleteShader(this._vertexShader);
        this._gl.deleteShader(this._fragmentShader);
        console.log(this._gl.getProgramInfoLog(this._program));
        throw "Error occurred while linking shaders";
    }
}
```

그리고, 프로그램을 사용하여 렌더링을 하기 전 `gl.useProgram(program)`을 호출하여 bind하는 것과, 렌더링을 한 후 `gl.useProgram(null)`로 bind을 푸는 것을 메소드로 감싸면 되겠습니다.

```typescript
start(): void {
    if (!this._deleted)
        this._gl.useProgram(this._program);
}

stop(): void {
    if (!this._deleted)
        this._gl.useProgram(null);
}
```

마지막으로, 프로그램을 삭제하는 메소드를 작성합니다.

```typescript
delete(): void {
    if (this._deleted)
        return;
    this._gl.deleteProgram(this._program);
    this._gl.deleteShader(this._vertexShader);
    this._gl.deleteShader(this._fragmentShader);
    this._deleted = true;
}
```

### Uniform Variables

> [OpenGL Wiki - Uniform (GLSL)](https://www.khronos.org/opengl/wiki/Uniform_(GLSL))

### 색을 정할 수 있는 Shader 작성



### Material 클래스


### 결과
