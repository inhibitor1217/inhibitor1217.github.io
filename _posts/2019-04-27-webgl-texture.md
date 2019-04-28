---
layout: post
title: "[WebGL] 05. Texture"
---
## Texture

> [WebGL 튜토리얼 목록]({{site.url}}/webgl-tutorials)

### 텍스쳐

> [OpenGL Wiki - Texture](https://www.khronos.org/opengl/wiki/Texture)

**텍스쳐**(Texture)는 그래픽스 라이브러리에서 보통 이미지를 부르는 단어로 쓰입니다. 실제로, 3D 게임들의 화면에 그려지는 것들은 단순한 3D 모델들일 뿐입니다. 하지만, 이 모델들에 적당한 이미지를 덮어씌우면 마치 현실에 존재하는 물체와 같이 보이게 됩니다.

<!--more-->

![texture-example](https://upload.wikimedia.org/wikipedia/commons/f/f2/Texture_mapping_demonstration_animation.gif)

> 출처: [Wikipedia - Texture Mapping](https://en.wikipedia.org/wiki/Texture_mapping)

하지만, 텍스쳐는 우리 화면에 그려지는 이미지 뿐만이 아니라 여러 가지 용도로 사용될 수 있습니다. 보통은 텍스쳐에 데이터를 읽고 쓰는 두 가지 용도로 사용됩니다.

- Shader 프로그램은 텍스쳐에서 데이터를 읽어들일 수 있습니다. 즉, 위의 GIF 이미지에서 볼 수 있는 것처럼 3D 모델에 붙일 이미지들을 텍스쳐로 전개도처럼 만든 후, 모델의 각 면에 적절히 데이터를 읽어들여 화면에 표시하는 원리입니다.
- GPU가 그려낸 화면을 바로 브라우저에 표시하는 것이 아니라, 텍스쳐에 그릴 수 있습니다. 텍스쳐에 그린 화면은 마치 이미지를 다루는 것처럼 여러 가지 후처리를 할 수 있는데, 이러한 처리를 통해 많은 그래픽 효과를 구현할 수 있습니다.

앞으로 튜토리얼을 진행하면서 텍스쳐라는 개념을 응용하여 여러 가지 효과를 구현할 것입니다. 하지만 이번 튜토리얼에서는 가장 기본이 되는 기능인, **이미지를 텍스쳐로 만들어 모델에 붙이는 과정**에 대해 살펴보도록 하겠습니다.

### WebGL Texture

WebGL에서는 VAO, BO, 프로그램 등 다른 오브젝트와 마찬가지로 텍스쳐 또한 생성, 삭제, bind API를 통해 관리할 수 있습니다.

```typescript
WebGLTexture gl.createTexture();
void gl.deleteTexture(WebGLTexture texture);
void gl.bindTexture(GLenum target, WebGLTexture texture);
```

WebGL에서는 여러 가지 종류의 텍스쳐(2D 텍스쳐, 3D 텍스쳐, 큐브맵 텍스쳐 등)를 동시에 bind 할 수 있기 때문에 `bindTexture` 함수의 `target` 인수로 어떤 종류에 텍스쳐에 bind 할 것인지 넘겨줍니다. 이 튜토리얼에서는 가장 기본인 2D 텍스쳐만 다룰 것이기 때문에 `gl.TEXTURE_2D`로 설정합니다.

또한, WebGL에서는 동시에 여러 개의 텍스쳐를 bind하고 있을 수 있습니다. 이 텍스쳐들은 texture unit이라고 부르는 인덱스로 구별합니다. 따라서, bind를 하기 전 `void gl.activeTexture(GLenum textureUnit);` API를 통해 어떤 texture unit에 접근할 것인지 선언하고 bind 등의 작업을 진행해야 합니다. 예를 들어,

```typescript
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
```

와 같은 코드를 실행하면 `TEXTURE0` unit에 `TEXTURE_2D` target으로 `texture`가 bind됩니다.

- 같은 texture unit에 서로 다른 target으로 두 텍스쳐를 동시에 bind하는 것이 가능한가요? -> **네.**
- 서로 다른 texture unit에 같은 target으로 두 텍스쳐를 동시에 bind하는 것이 가능한가요? -> **네.**

### Texture 클래스

`Mesh`, `Program` 클래스처럼 텍스쳐 또한 WebGL의 API를 감싸는 클래스를 만들어 어플리케이션에서 WebGL API에 접근하지 않고 텍스쳐를 사용할 수 있도록 만들어 줍니다. `src/engine/textures/` 디렉토리를 만든 후 `src/engine/textures/Texture2D.ts` 파일에 다음 코드를 작성하세요.

```typescript
import global from 'global';

export default class Texture2D {

    _gl: WebGL2RenderingContext;
    _texture: WebGLTexture;
    _image: HTMLImageElement;
    _deleted: boolean;

    constructor() {
        
        this._gl = global.get('gl');
        this._texture = this._gl.createTexture();

        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, 
            1, 1, 0, this._gl.RGBA, this._gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
        this._gl.bindTexture(this._gl.TEXTURE_2D, null);

    }

    bind(textureUnit: GLenum): void {
        if (!this._deleted) {
            this._gl.activeTexture(textureUnit);
            this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        }
    }

    unbind(textureUnit: GLenum): void {
        if (!this._deleted) {
            this._gl.activeTexture(textureUnit);
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
        }
    }

    delete(): void {
        if (!this._deleted) {
            this._gl.deleteTexture(this._texture);
            this._deleted = true;
        }
    }

    getTexture(): WebGLTexture { return this._texture; }
    getImage(): HTMLImageElement { return this._image; }

}
```

Constructor에서 사용하는 `gl.texImage2D` API는 텍스처에 데이터를 채워 넣을 때 사용합니다. 데이터는 byte array 형식이기 때문에, BO나 VAO를 다룰 때처럼 byte array에 적힌 데이터를 어떻게 해석해야 하는지 설정해준다는 점에 유의하세요. 텍스쳐의 가로와 세로 길이, 각 픽셀에서 R, G, B, alpha가 각각 몇 바이트의 데이터를 차지하는지, 그 데이터의 타입이 무엇인지 등을 전부 인자로 지정해 주어야 합니다.

> 자세한 정보는 [링크](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D)를 참조하시면 됩니다.

```typescript
this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, 
            1, 1, 0, this._gl.RGBA, this._gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
```
Constructor에서는 위의 호출을 통해 단 하나의 픽셀 (255, 0, 255, 255)로 이루어진 1x1짜리 텍스쳐 데이터를 채워 넣습니다. 이 데이터를 **실제로 텍스쳐에 채워 넣을 이미지를 브라우저가 불러오기 전까지 placeholder로 사용**합니다. 이미지를 불러오는 것은 비동기적(asynchronous)으로 진행되므로, 다 다운로드 하기 전까지 WebGL이 읽을 텍스처 데이터가 필요하기 때문이죠.

이미지를 불러와서 텍스쳐에 집어넣는 메소드 또한 작성합니다.

```typescript
loadFromImage(imageSrc: string): void {
    if (!this._deleted) {
        this._image = new Image();
        this._image.onload = () => {
            this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, this._image);
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
        };
        this._image.src = imageSrc;
    }
}
```
이미지를 불러온 후 `onload` 함수가 호출되어 데이터를 텍스쳐에 `texImage2D` API로 채워넣게 됩니다.

### Shader 프로그램 작성

이전에 작성한 `src/engine/shaders/DefaultShader.ts`는 `Material`에서 색깔을 설정하면 그 색깔로 직사각형을 그리도록 코드를 작성했는데, 이제 텍스쳐가 존재하면 그 이미지를 직사각형에 그리도록 shader를 작성해 봅시다.

먼저 **UV Coordinate**라는 개념에 대해 알아보도록 하겠습니다. 앞서 텍스처는 3D 모델에 붙일 이미지들의 "전개도"와 같은 역할을 한다고 설명했었습니다. 따라서, 각 모델에 전개도에 어떤 부분을 붙여야 할지 모델의 vertex attribute로 shader 프로그램에 알려주어야 합니다. 이 attribute를 보통 uv 좌표라고 부릅니다.

텍스쳐에서는 맨 왼쪽 위를 `(0, 0)`, 맨 오른쪽 아래를 `(1, 1)`로 하는 좌표계를 사용합니다. 따라서, 우리가 화면에 그릴 직사각형은 다음 그림과 같은 vertex attribute를 가집니다.

![uv-rectangle]({{site.url}}/images/webgl-texture-uv-rectangle.PNG)

마찬가지로 만약 정육면체 모양의 모델에 텍스쳐를 덮어씌우고 싶다면, 정육면체의 각 면에 들어갈 그림을 6개 담은 텍스쳐를 준비한 후 적절히 uv 좌표를 설정해주면 되겠습니다. (이후 튜토리얼에서 다루도록 하겠습니다.)

먼저 vertex shader 코드에 다음 내용을 작성하세요.

```GLSL
#version 300 es

layout(location = 0) in vec2 position;
layout(location = 1) in vec2 uv;

out vec2 pass_uv;

void main() {
    gl_Position = vec4(position, 0, 1);
    pass_uv = uv;
}
```
기존에 0번 attribute로 넘겨주는 vertex 위치와 더불어, 1번 attribute로 각 vertex의 uv 좌표도 넘겨줍니다. 이 좌표는 `pass_uv` 변수를 통해 그대로 fragment shader로 전달합니다.

WebGL API를 사용하여 bind한 텍스처는 uniform variable을 통해 GLSL 코드에서 접근할 수 있습니다.  GLSL에서는 `uniform sampler2D sampler;`와 같이 텍스쳐의 target(`TEXTURE_2D` -> `sampler2D`)을 명시합니다. 그 후, `sampler`를 마치 `int` 타입의 uniform variable처럼 생각해 texture unit을 설정합니다. `sampler`를 0으로 설정하면 `TEXTURE0` unit에 bind된 텍스처를 사용하게 되는 것입니다.

Fragment shader 코드에 다음 내용을 작성하세요.

```GLSL
#version 300 es

precision mediump float;

in vec2 pass_uv;

uniform float use_texture;
uniform sampler2D sampler;
uniform vec3 color;

out vec4 out_color;

void main() {
    out_color = mix(vec4(color, 1), texture(sampler, pass_uv), use_texture);
}
```

`mix(x, y, a)` 함수는 `x * (1-a) + y * a` 값을 반환합니다. 즉, `use_texture` 변수가 0이면 텍스처를 사용하지 않고 `Material`에서 설정한 색깔(`vec4(color, 1)`)을 사용하는 경우, 1이면 텍스처를 사용하는 경우(`texture(sampler, pass_uv)`)를 나타내는 것이죠. 물론 다음 코드와 같이 작성할 수도 있습니다.
```GLSL
if (use_texture)
    out_color = texture(sampler, pass_uv);
else
    out_color = vec4(color, 1);
```
하지만, **GPU에서 조건-분기문을 사용하는 것은 성능을 저하시키기 때문에 금기시됩니다**. GPU는 동시에 여러 데이터에 대해 같은 instruction을 실행시키는 병렬화를 통해 빠르게 작동하는데, 조건-분기문을 통해 서로 다른 instruction을 실행하게 될 경우 많은 clock cycle을 손해 보기 때문입니다. 따라서 if-else를 통해 `out_color`를 결정하는 것보다 `mix`를 통해 같은 효과를 내는 shader 프로그램이 훨씬 더 빠르게 동작합니다.

> 그러나, 이 경우는 분기를 발생시키는 조건문이 uniform variable에 걸려있기 때문에, 컴파일러가 컴파일 시 각 분기에 따라 서로 다른 shader 프로그램 두 개를 만들어 uniform variable의 값에 따라 다른 프로그램을 사용하는 방식으로 최적화를 진행하여 별로 차이가 나지 않습니다. 하지만 일반적으로 조건-분기문은 shader의 성능을 떨어뜨리는 원인이므로 유의해야 합니다.

### Material 클래스 수정

다음으로는, 이전에 작성한 `Material` 클래스가 텍스쳐를 지원하도록 수정합니다. `Material`에 텍스쳐를 설정할 수 있도록 `_texture` attribute와 get/set 메소드를 만들어 줍니다.

```typescript
...
export default class Material {

    ...
    _texture2D: Texture2D;
    ...

    ...
    getTexture(): Texture2D { return this._texture2D; }
    setTexture(texture2D: Texture2D): void { this._texture2D = texture2D; }
    ...

}
```

`start` 메소드에서는 텍스쳐가 존재하는지 여부에 따라 shader 프로그램의 `use_texture`, `sampler`, `color` uniform variable의 값을 적절히 설정하고, 텍스쳐가 존재하면 `TEXTURE0` unit에 bind 해줍니다.

```typescript
...
start(program: Program): void {
    program.start();
    program.setUniform1f('use_texture', this._texture2D ? 1 : 0);
    if (this._texture2D) {
        this._texture2D.bind(this._gl.TEXTURE0);
        program.setUniform1i('sampler', 0);
    } else {
        program.setUniform3f('color', this._color[0], this._color[1], this._color[2]);
    }
}
...
```

`stop` 메소드에서는 bind한 텍스쳐를 다시 풀어줍니다.
```typescript
...
stop(program: Program): void {
    program.stop();
    if (this._texture2D) {
        this._texture2D.unbind(this._gl.TEXTURE0);
    }
}
...
```

### 메인 루프

어플리케이션에서 새로 작성한 클래스들을 적용하여 원하는 이미지를 직사각형에 그려 보도록 하겠습니다. 먼저, 앞서 보았던 그림처럼 직사각형의 vertex attribute를 설정해 줍니다. Vertex attribute에 uv 또한 추가된다는 사실에 유의하세요.

![uv-rectangle]({{site.url}}/images/webgl-texture-uv-rectangle.PNG)

```typescript
const mesh = new Mesh();
mesh.updateVertexBuffer(new Float32Array([
    -0.5,  0.5, 0, 0,
    -0.5, -0.5, 0, 1,
     0.5,  0.5, 1, 0,
     0.5, -0.5, 1, 1
]));
mesh.updateIndexBuffer(new Uint32Array([
    0, 1, 3, 0, 3, 2
]));
mesh.configure([[gl.FLOAT, 2], [gl.FLOAT, 2]]);
mesh.setCount(6);
```

다음으로, 텍스쳐를 생성하고 원하는 이미지를 불러온 후 `Material`에서 그 텍스쳐를 사용하도록 설정합니다. 불러올 이미지의 URL을 `loadFromImage` 함수의 인자로 넘겨줍니다.
```typescript
const texture = new Texture2D();
texture.loadFromImage('res/textures/sample_texture.png');
material.setTexture(texture);
```

마지막으로, 렌더링하는 부분을 약간 수정하도록 하겠습니다. 기존에는 GPU에 그리는 명령을 단 한 번 호출했는데, 지금은 텍스쳐에 담길 이미지를 비동기적으로 불러오기 때문에 이미지를 불러온 후 다시 GPU에 명령을 내리는 것이 필요하기 때문입니다. 따라서, 무한 루프로 GPU에 화면에 계속해서 렌더링을 수행하도록 수정합니다.

```typescript
const mainLoop = (time: number) => {
    /* Initialize frame buffer with color (0, 0, 0, 1). */
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    mesh.start();
    material.start(defaultShader);

    mesh.render();

    mesh.stop();
    material.stop(defaultShader);

    requestAnimationFrame(mainLoop);
}

/* Start main loop. */
requestAnimationFrame(mainLoop);
```

`mainLoop` 함수 내에서 다시 `requestAnimationFrame(mainLoop)`를 호출하기 때문에 `mainLoop` 함수가 무한히 반복되고, 그 안의 `mesh.render()` 함수도 계속해서 호출되는 방식입니다.

### 결과

아래 링크처럼, 원하는 이미지가 직사각형의 텍스쳐로 나타난 것을 볼 수 있습니다. 더 구체적으로는
- 이미지를 불러오기 전에는 placeholder로 설정한 자주색 (255, 0, 255, 255) 텍스쳐가 사용되어 직사각형이 잠깐 동안 자주색으로 보입니다.
- 이미지를 다 불러오면 텍스쳐에 담긴 데이터가 그 이미지 데이터로 교체되어, 직사각형에 제대로 된 이미지가 나타납니다.

[Preview]({{site.url}}/pages/webgl-tutorials/05-texture)

- 직사각형의 uv 좌표를 적절히 조정하여, 이미지가 뒤집혀서 나타나도록 시도해 보세요.
- 이전 튜토리얼처럼 텍스쳐를 설정하지 않고 특정 색깔로 직사각형을 그리는 것도 여전히 잘 작동하는지 확인해 보세요.

### 링크

[GitHub Repository](https://github.com/inhibitor1217/webgl-tutorials/tree/master/tutorials/05-texture)