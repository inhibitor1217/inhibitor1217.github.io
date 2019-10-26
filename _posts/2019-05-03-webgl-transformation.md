---
layout: post
title: "06. Transformation"
tags: [webgl]
---
> [WebGL 튜토리얼 목록]({{site.url}}/1_webgl-tutorials)

지금까지는 화면에 어떤 모델을 그리고 싶을 때, 우리가 작성한 클래스들 중 `Mesh`의 `updateVertexBuffer` 메소드(또는 이 메소드가 이용하는 `gl.bufferData` API)를 사용하여 GPU에 모델의 vertex attribute 데이터를 전달했습니다. 우리가 접하는 많은 그래픽 어플리케이션에서는 매 프레임마다 화면의 물체들이 움직입니다. 하지만 매 프레임마다 새로운 데이터를 GPU에 전달하는 것은 매우 비효율적인 작업일 것입니다. 특히, 모델의 형태 자체가 바뀌는 것이 아니라 단순히 화면 상에서 돌아다닐 뿐이라면, 다른 방법으로 이것을 구현할 수 있지 않을까요?

<!--more-->

## 직사각형 이동시키기

CPU에서 GPU에게 모델의 위치를 전달하기 위해 사용할 수 있는 가장 좋은 방법은 uniform variable을 활용하는 것입니다.

> [Uniform Variable 알아보기]({{site.url}}/2019/04/23/webgl-material)  
> [OpenGL Wiki - Uniform (GLSL)](https://www.khronos.org/opengl/wiki/Uniform_(GLSL))

직사각형을 좌우로 이동시키는 기능을 추가하기 위해, `src/engine/shaders/DefaultShader.ts`의 vertex shader 코드에 다음 내용을 작성하세요.

```GLSL
#version 300 es

layout(location = 0) in vec2 position;
layout(location = 1) in vec2 uv;

uniform float x;

out vec2 pass_uv;

void main() {
    gl_Position = vec4(position.x + x, position.y, 0, 1);
    pass_uv = uv;
}
```
Shader 코드에 `x` uniform variable을 설정하고, 모델의 vertex attribute `position`의 x값에 더해줍니다. 즉, 원래 직사각형의 왼쪽 꼭지점의 좌표가 `(-0.5, 0.5)`인데, `x=0.1`로 설정하면 화면에는 `(-0.4, 0.5)`에 표시되는 것입니다. 마찬가지로 다른 꼭짓점들도 이동하여 전체 직사각형이 이동하게 됩니다.

어플리케이션에서 `Program.setUniform1f` API로 `x`값을 설정하여 직사각형을 마음대로 이동시켜 보세요.

```typescript
...
defaultShader.setUniform1f('x', 0.3);
...
```

![uniform-1]({{site.url}}/images/2019-05-03-webgl-transformation/uniform-1.png)

## Matrix Transformation

물체를 이동시키기 위해 x, y, z 값을 일일이 uniform variable로 shader 프로그램에 전달하는 것 보다 좀 더 일반적인 해결책을 찾아봅시다. 바로 **행렬**과 **일차변환**을 이용하는 방법입니다. 하지만 이 튜토리얼에서 자세한 수학은 다루지 않을 계획입니다. 물체를 이동, 회전하는 연산이 어떻게 행렬로서 표현되는지 궁금하시다면 아래 링크들을 참조하시면 좋을 것 같습니다.

- **3BlueBrown - Linear Transformation and Matrices**
[![3BlueBrown - Linear transformations and matrices](http://img.youtube.com/vi/kYB8IZa5AuE/0.jpg)](https://youtu.be/kYB8IZa5AuE)  
- [Wikipedia - Transformation Matrix](https://en.wikipedia.org/wiki/Transformation_matrix)  
- WebGLFundamentals  
    - [2D Translation](https://webglfundamentals.org/webgl/lessons/webgl-2d-translation.html)
    - [2D Rotation](https://webglfundamentals.org/webgl/lessons/webgl-2d-rotation.html)
    - [2D Scaling](https://webglfundamentals.org/webgl/lessons/webgl-2d-scale.html)
    - [2D Transformation Matrices](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html)

Uniform variable로 `x`값을 전달하는 대신 4x4 크기의 **변환행렬**(transformation matrix)을 전달하는 코드를 작성해 봅시다. `mat4`는 GLSL에서 4x4 행렬을 나타내는 타입입니다. 변환행렬을 각 vertex의 위치 벡터에 곱하는 연산으로 vertex들을 이동, 회전시킵니다.
```GLSL
#version 300 es

layout(location = 0) in vec2 position;
layout(location = 1) in vec2 uv;

uniform mat4 transformation;

out vec2 pass_uv;

void main() {
    gl_Position = transformation * vec4(position, 0, 1);
    pass_uv = uv;
}
```
`Program` 클래스에서는 `gl.uniformMatrix4fv` API를 통해 shader 프로그램의 `mat4` uniform variable을 설정하는 메소드를 새로 작성하세요.
```typescript
setUniformMatrix4fv(variableName: string, value: Float32Array) {
    this._gl.uniformMatrix4fv(this._getUniformLocation(variableName), false, value);
}
```
어플리케이션에서 x를 0.3만큼 이동시키는 변환행렬 
```
[
    1, 0, 0, 0.3,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
]
```
로 `transformation`을 설정하여 아까와 같은 결과를 얻을 수 있습니다.
```typescript
defaultShader.setUniformMatrix4fv('transformation', new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.3, 0, 0, 1
]));
```

## Transform 클래스

우리가 직접 변환행렬을 계산하는 것은 불편하므로, 이를 도와주는 NPM module `gl-matrix`를 사용합니다.
```
$ npm install gl-matrix
```
`gl-matrix`은 2, 3, 4차원 벡터(`vec2, vec3, vec4`)와 행렬 연산, Quaternion 등 변환행렬을 편리하게 계산할 수 있는 API들을 제공하는 module입니다. 이 module을 사용해서 우리가 직관적으로 다룰 수 있는 위치, 회전 등의 정보로부터 변환행렬을 계산하는 `Transform` 클래스를 작성해 봅시다.
```typescript
import { vec3, quat, mat4 } from 'gl-matrix';

export default class Transform {

    _position: vec3;
    _rotation: quat;
    _scale: vec3;
    _localTransformation: mat4;
    _updated: boolean;

    constructor() {
        this._position = vec3.create();
        this._rotation = quat.create();
        this._scale = vec3.fromValues(1, 1, 1);
        this._localTransformation = mat4.create();
        this._updated = false;
    }

    getLocalTransform(): mat4 {
        if (this._updated) {
            mat4.fromRotationTranslationScale(
                this._localTransformation, this._rotation, this._position, this._scale
            );
            this._updated = false;
        }
        return this._localTransformation;
    }

    getPosition(): vec3 { return vec3.copy(vec3.create(), this._position); }
    setPosition(position: vec3): void { 
        if (!vec3.equals(this._position, position)) {
            vec3.copy(this._position, position);
            this._updated = true;
        }    
    }

    getRotation(): quat { return quat.copy(quat.create(), this._rotation); }
    setRotation(rotation: quat): void {
        if (!quat.equals(this._rotation, rotation)) {
            quat.copy(this._rotation, rotation);
            this._updated = true;
        }
    }
    rotateEulerX(angle: number): void {
        quat.rotateX(this._rotation, this._rotation, angle);
        this._updated = true;
    }
    rotateEulerY(angle: number): void {
        quat.rotateY(this._rotation, this._rotation, angle);
        this._updated = true;
    }
    rotateEulerZ(angle: number): void {
        quat.rotateZ(this._rotation, this._rotation, angle);
        this._updated = true;
    }

    getScale(): vec3 { return vec3.copy(vec3.create(), this._scale); }
    setScale(scale: vec3): void {
        if (!vec3.equals(this._scale, scale)) {
            vec3.copy(this._scale, scale);
            this._updated = true;
        }
    }

}
```
어플리케이션은 3D 공간 내에 원하는 위치(`position`), 회전(`rotation`), 크기(`scale`)로 모델을 그릴 수 있습니다. 어플리케이션이 `set` 메소드들로 위치, 회전 등을 바꿀 때마다 `Transform` 클래스 내부에서는 `_localTransformation`을 새로 계산해 줍니다.

회전을 설정하는 메소드 중 `rotateEulerX`는 x축을 중심으로 `angle`만큼 회전시키는 메소드입니다. 3차원 상에서 물체의 회전 상태를 나타내는 방법은 여러 가지가 있는데, 그 중 x, y, z축을 중심으로 회전한 각도를 **Euler Angle**이라고 합니다. 마찬가지로, `rotateEulerY, rotateEulerZ` 메소드는 각각 y, z축을 중심으로 회전시키는 메소드입니다.

## 어플리케이션에서 Transform 다루기

`src/main.ts`에서 렌더링 루프에 들어가기 전 `Transform`을 초기화해줍니다.
```typescript
...
const transform = new Transform();
...
```
`Transform` 클래스의 메소드들을 이용해서 직사각형을 계속 돌아가도록 설정해 봅시다. 직사각형이 반지름이 `r`인 원을 따라 주기 `T`로 움직이게 하려면 시간 `t`에 x, y좌표를 `(r * cos(2 * pi * t / T), r * sin(2 * pi * t / T))`로 하면 되겠죠.

```typescript
const mainLoop = (time: number) => {

    /* Initialize frame buffer with color (0, 0, 0, 1). */
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    /* Handle animation. */
    transform.setPosition(
        vec3.fromValues(
            0.3 * Math.cos(2 * Math.PI * time / 5000), 
            0.3 * Math.sin(2 * Math.PI * time / 5000),
            0
        )
    );

    /* Rendering. */
    mesh.start();
    material.start(defaultShader);
    defaultShader.setUniformMatrix4fv('transformation', transform.getLocalTransform());

    mesh.render();

    mesh.stop();
    material.stop(defaultShader);

    requestAnimationFrame(mainLoop);

}

/* Start main loop. */
requestAnimationFrame(mainLoop);
```

`requestAnimationFrame` 함수의 인자로 넘겨주는 `mainLoop` 함수의 입력으로 시작으로부터 경과한 시간 `time`을 milisecond 단위로 받을 수 있습니다. `mainLoop` 함수 중간에 `transform.setPosition` 메소드를 통해 직사각형을 5초에 한 번 회전하도록 설정합니다. 그 후, 설정한 `transform`의 변환행렬을 `setUniformMatrix4fv` 메소드로 shader 프로그램에 전달합니다.

## 결과

[Preview]({{site.url}}/pages/webgl-tutorials/06-transformation)

의도한 대로 직사각형이 5초마다 원을 그리며 움직이는 것을 볼 수 있습니다. 어플리케이션에서 `setPosition` 메소드 외에 다른 메소드들을 사용해서 다른 효과를 연출해 보세요.

> Preview page에서, 직사각형의 변 부분 텍스쳐가 깜빡깜빡 거리는 이유는 무엇일까요?

## 링크
[GitHub Repository](https://github.com/inhibitor1217/webgl-tutorials/tree/master/tutorials/06-transformation)