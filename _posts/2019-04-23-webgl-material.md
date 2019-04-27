---
layout: post
title: "[WebGL] 04-2. Uniform Variables, Material"
---
## Uniform Variables, Material

> [WebGL 튜토리얼 목록]({{site.url}}/webgl-tutorials)

이번 튜토리얼에서는 shader를 다루는 WebGL API들을 감싸는 클래스들을 만들어 엔진에 추가합니다. `src/engine/` 디렉토리 내에 `components/Material.ts`, `shaders/Program.ts`, `shaders/DefaulShader.ts` 파일을 생성하세요.

<!--more-->

```
.
├── src
│   ├── engine
│   │   ├── components
│   │   │   ├── Mesh.ts
│   │   │   └── Material.ts
│   │   └── shaders
│   │       ├── Program.ts
│   │       └── DefaultShader.ts
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

계속해서 코드를 작성하기 전, **uniform variable**이라는 개념에 대해 알아보도록 하겠습니다. 그래픽스 파이프라인에서 shader 프로그램에서 사용할 수 있는 입력 변수들은 vertex attribute를 통해 주어집니다. 그런데, 물체의 색깔처럼 모든 vertex에 대해 동일하게 주어지는 값이 있다면, 일일이 모든 vertex에 대해 똑같은 값을 attriute에 집어넣는 것은 공간 낭비일 것입니다. 

그래서 OpenGL과 WebGL의 shader들은 **전역 변수**처럼 작동하는 변수를 제공하는데, 이 변수를 uniform variable이라고 합니다. GLSL 코드에서 uniform variable은 `uniform` 키워드로 나타냅니다. `uniform vec3 color;` 과 같은 변수 선언을 통해, `color`라는 변수를 uniform variable로 지정합니다. 

Vertex attribute에 들어가는 데이터는 CPU에서 먼저 GPU로 전달하고 나중에 GPU에서 값을 읽어들이는 것과 마찬가지로, uniform variable도 CPU에서 값을 설정하여 GPU로 옮기고, shader 프로그램이 실행될 때 GPU에서 값을 읽게 됩니다. CPU에서 uniform variable의 값을 설정하려면 `uniform`으로 시작하는 API를 사용합니다. `color`는 `vec3` 타입을 가지는 `float` 형식의 데이터니까 `gl.uniform3f(location, value)` API를 쓰면 됩니다.
- `location` 인자는 `gl.getUniformLocation(program, uniformVariableName)` API를 사용해서 구한 uniform variable의 위치입니다. `gl.getUniformLocation` 함수를 사용할 때는 uniform variable이 들어있는 shader 프로그램과 위치를 찾을 variable의 이름(string)을 인자로 넘겨줍니다.
- `value`는 uniform variable에 넣을 값입니다.

예를 들어, `program`이라는 shader 프로그램에서 `uniform vec3 color`의 값을 `(1, 1, 1)`로 바꾸고 싶다면 다음과 같은 함수 호출이 필요합니다.
```typescript
    gl.uniform3f(gl.getUniformLocation(program, 'color'), 1, 1, 1);
```

### 색을 정할 수 있는 Shader 작성

Uniform variable을 활용하여 엔진 내에 색깔을 설정할 수 있는 shader를 작성해 봅시다. `engine/shaders/DefaultShader.ts` 파일에 GLSL로 vertex shader와 fragment shader를 추가합니다. Vertex shader는 달라지는 것 없이 동일하게 적습니다.

```typescript
const vertexShaderSource = 
`#version 300 es
layout(location = 0) in vec2 position;
void main() {
    gl_Position = vec4(position, 0, 1);
}
`
```

Fragment shader에서는 uniform variable인 `color`를 통해 어플리케이션에서 직사각형을 무슨 색깔로 그릴지 정할 수 있도록 합니다. 하얀색 `(1, 1, 1, 1)` 대신 `color`를 `out_color`로 설정하는 점이 달라진 것을 확인하세요.

```typescript
const fragmentShaderSource = 
`#version 300 es
precision mediump float;
uniform vec3 color;
out vec4 out_color;
void main() {
    out_color = vec4(color, 1);
}
`
```

그리고 작성한 GLSL shader 코드를 사용하는 `DefaultShader` 클래스를 만들어 줍니다.

```typescript
export default class DefaultShader extends Program {

    constructor() {
        super(vertexShaderSource, fragmentShaderSource);
    }

}
```

### Material 클래스

Material 클래스는 shader 프로그램과 그 프로그램에서 사용하는 uniform variable들을 모아서 관리하는 기능을 제공하는 클래스입니다. 즉, `gl.uniform` API를 호출하여 uniform variable의 값을 바꾸는 과정을 감싸 클래스의 메소드로 만들 것입니다.

```typescript
import global from 'global';
import Program from 'engine/shaders/Program';

export default class Material {
    
    _gl: WebGL2RenderingContext;
    _program: Program;
    _uniformLocations: {[key: string]: WebGLUniformLocation};

    constructor(program: Program) {
        this._gl = global.get('gl');
        this._program = program;
    }

    start(): void {
        this._program.start();
    }

    stop(): void {
        this._program.stop();
    }

    setColor(r: number, g: number, b: number) {
        this._setUniform3f('color', r, g, b);
    }
    
    getProgram(): Program { return this._program; }

    _setUniform1f(variableName: string, v0: number): void {
        this._gl.uniform1f(this._getUniformLocation(variableName), v0);
    }
    _setUniform2f(variableName: string, v0: number, v1: number): void {
        this._gl.uniform2f(this._getUniformLocation(variableName), v0, v1);
    }
    _setUniform3f(variableName: string, v0: number, v1: number, v2: number): void {
        this._gl.uniform3f(this._getUniformLocation(variableName), v0, v1, v2);
    }
    _setUniform4f(variableName: string, v0: number, v1: number, v2: number, v3: number): void {
        this._gl.uniform4f(this._getUniformLocation(variableName), v0, v1, v2, v3);
    }

    _getUniformLocation(variableName: string): WebGLUniformLocation {
        if (!this._uniformLocations[variableName])
            this._uniformLocations[variableName] = this._gl.getUniformLocation(this._program, variableName);
        return this._uniformLocations[variableName]; 
    }

}
```

Material 클래스에서 `setUniform` 메소드들을 사용해서 uniform variable의 값을 설정할 수 있습니다. Shader 프로그램에서 uniform variable의 위치를 찾아서 `_uniformLocations` property에 저장해두면 처음 호출할 때만 `gl.getUniformLocation` API를 사용하고 그 다음부터는 저장된 값을 사용하게 됩니다.


### 결과

새로 만들어진 클래스들을 어플리케이션 코드에 적용해 봅시다. `src/main.ts`에서 shader를 활용하는 부분 코드를 지우고, 대신 `DefaultShader`와 이 shader 프로그램을 이용하는 `Material`을 생성합니다.

```typescript
const defaultShader = new DefaultShader();
const material = new Material(defaultShader);
```

그리고 직사각형을 렌더링하는 부분에 다음 코드를 적어주세요.
```typescript
mesh.start();
material.start();
material.setColor(1, 0, 0); // (r, g, b) = (1, 0, 0) 빨간색으로 설정

mesh.render();

mesh.stop();
material.stop();
```

어플리케이션에서 WebGL API를 직접 호출하지 않고도 엔진의 클래스들을 활용해서 직사각형을 렌더링할 수 있게 되었습니다.

[Preview]({{site.url}}/pages/webgl-tutorials/04-2-material)

### 링크

[GitHub Repository](https://github.com/inhibitor1217/webgl-tutorials/tree/master/tutorials/04-shader)