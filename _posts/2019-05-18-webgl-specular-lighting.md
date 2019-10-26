---
layout: post
title: "09. Specular Lighting, Ambient Lighting"
tags: [webgl, shader]
---
> [WebGL 튜토리얼 목록]({{site.url}}/1_webgl-tutorials)

[전 튜토리얼]({{site.url}}/2019/05/10/webgl-diffuse-lighting)에서는 가장 기본이 되는 shading 알고리즘 중 diffuse reflection(난반사)를 근사하여 표현하는 Lambertian model에 대해 알아보고, 이를 구현하는 GLSL 코드를 작성해 보았습니다. 이번 튜토리얼에서는 specular reflection(정반사)를 표현하는 모델들과 ambient lighting에 관해 알아보고, 마찬가지로 GLSL shader 프로그램으로 이를 구현해 보도록 하겠습니다.

<!--more-->

## Specular Lighting

![specular-1]({{site.url}}/images/2019-05-18-webgl-specular-lighting/specular-1.png){: .center-image}

[Wikipedia - Specular Highlight](https://en.wikipedia.org/wiki/Specular_highlight)

Specular lighting은 물체의 표면이 반짝거리는 듯한 효과를 줍니다. Diffuse lighting만으로는 금속, 플라스틱, 물 등의 물체를 효과적으로 표현하지 못하는데, specular lighting으로 이를 보완할 수 있습니다.

정반사는 매끈한 표면에서 일어납니다. 입사하는 빛이 표면에 반사될 때, 난반사와 같이 모든 방향에서 반사된 빛을 볼 수 있는 것이 아니라, 특정한 방향에서만 이 빛을 볼 수 있습니다. Specular lighting을 표현하는 여러 모델에서는 **어떤 방향**에서, **얼마나** 이 빛을 볼 수 있는지 정의합니다. (물론, 과학적으로 정확하지는 않습니다만, 사실적인 효과를 연출하기에는 충분합니다.)

Specular lighting 모델들의 수식을 살펴보기 전, 이전 튜토리얼에서 다뤘던 diffuse lighting의 수식을 잠깐 다시 살펴보도록 하겠습니다.

$$I_{d} = k_{d} i_l (\hat{N} \cdot \hat{L} )$$

이 식의 핵심 부분은 반사된 빛의 세기가 $$(\hat{N} \cdot \hat{L} )$$에 비례한다는 점입니다. 이는 표면의 법선과 빛의 입사 방향 사이의 각도에 관련이 있습니다. (어떤 방향에서 가상 카메라가 물체를 바라보고 있는지에는 무관합니다.)

Specular lighting에 의해 반사된 빛은 특정 방향에서만 볼 수 있으므로, 빛의 입사 방향($$\hat{L}$$)과 표면의 법선 방향($$\hat{N}$$), 그리고 **카메라가 어떤 방향에서 물체를 보고 있는지**($$\hat{V}$$)에 따라 얼마나 반사된 빛을 볼 수 있는지 결정됩니다.

### Specular Lighting - Phong model

$$I_{s} = k_{s} i_l (\hat{R} \cdot \hat{V})^{n}$$

Specular lighting을 설명하는 모델 중 하나인 Phong model에서는 빛의 세기를 $$(\hat{R} \cdot \hat{V})^{n}$$에 비례한다고 가정합니다. 여기에서 $$\hat{R}$$은 반사된 빛의 방향 벡터로, 빛의 입사 방향과 표면의 법선 벡터로부터 쉽게 계산할 수 있습니다.

$$\hat{R} = 2(\hat{N} \cdot \hat{L})\hat{N} - \hat{L}$$

반사된 빛의 방향과 카메라의 방향이 가까울수록 specular lighting에 의한 빛의 세기가 더 커지는데, 지수 $$n$$이 어떻게 커질지 결정합니다. $$n$$이 클수록 우리에게는 반사된 빛이 더 "집중된" 것처럼 보입니다. 아래 그림에서 확인해 보세요.

| $$n=10$$ | $$n = 25$$ | $$n = 50$$ |
|   :-:    |    :-:     |    :-:     |
| ![phong-1]({{site.url}}/images/2019-05-18-webgl-specular-lighting/phong-1.png) | ![phong-2]({{site.url}}/images/2019-05-18-webgl-specular-lighting/phong-2.png) | ![phong-3]({{site.url}}/images/2019-05-18-webgl-specular-lighting/phong-3.png) |


### Specular Lighting - Blinn-Phong model

Blinn-Phong model은 그냥 Phong model과 비슷하지만 $$\hat{R}$$을 직접 계산하는 대신 다른 방법을 사용합니다. $$\hat{H}$$를 $$\hat{V}$$와 $$\hat{L}$$의 중간 방향이라고 하면, $$\hat{R}$$과 $$\hat{V}$$ 사이 각도는 $$\hat{N}$$과 $$\hat{H}$$ 사이 각도의 2배가 됩니다. (직접 그림을 그려 확인해 보세요!) 따라서 Phong model의 식을 아래 식으로 대충 근사할 수 있습니다.

$$I_{s} = k_{s} i_l (\hat{H} \cdot \hat{N})^{n'}$$

$$\hat{R}$$을 계산하는 것보다 $$\hat{H}$$를 계산하는 것이 빠르므로 더 효율적인 방법입니다.

## GLSL shader에서 specular lighting 구현하기

Specular lighting을 구현하기 위해서는 빛의 세기를 계산하는 fragment shader에서 $$\hat{V}$$를 알고 있어야 합니다. $$\hat{V}$$는 물체에서 카메라를 향하는 벡터로, vertex shader에서 계산할 수 있습니다. Vertex shader의 output으로 $$\hat{V}$$를 내보내도록 수정합니다.

```GLSL
// Vertex shader
...
layout(location = 0) in vec3 position;
...
uniform mat4 transformation;
uniform mat4 inverseCameraTransformation;
...
out vec3 world_viewpoint;
...
void main() {
    ...
    vec4 world_position_h = transformation * vec4(position, 1);
    ...
    world_viewpoint = -(inverseCameraTransformation * vec4(0, 0, 0, 1)).xyz - world_position_h.xyz;
}
```
카메라의 위치를 계산하기 위해 ([이전]({{site.url}}/2019/05/07/webgl-view-projection)에 다뤘던) 가상 카메라의 변환행렬의 역행렬인 `inverseCameraTransformation`을 사용합니다. 카메라의 위치 벡터에서 vertex의 위치 벡터를 빼서 `world_viewpoint` 벡터($$\hat{V}$$)를 계산합니다.

Fragment shader에서는 넘겨받은 $$\hat{V}$$와 $$\hat{L}$$, $$\hat{N}$$을 사용해서 specular lighting을 구현합니다. 먼저 Phong model의 수식을 사용하여 구현해 봅시다. 아직 '광원'이라는 개념을 엔진에 추가하지 않았기 때문에, 계산에 필요한 빛의 색깔과 방향 등은 상수로 추가합니다. `specular_exponent`는 수식에서 $$n$$값을 나타냅니다.

```GLSL
// Fragment shader
...
const vec3 specular_color = vec3(1, 1, 1);
const float specular_intensity = 1.0;

const vec3  light_direction = vec3(0, 0, 1);
const float light_intensity = 1.0;
const vec3  light_color = vec3(1, 1, 1);

const float specular_exponent = 50.0;
...
```

$$\hat{V}, \hat{L}, \hat{N}, \hat{R}$$을 계산합니다.

```GLSL
void main() {
    ...
    vec3 n_world_normal    = normalize(world_normal);
    vec3 n_light_direction = normalize(light_direction);
    vec3 n_reflection      = normalize(2.0 * dot(n_world_normal, n_light_direction) * n_world_normal - n_light_direction);
    vec3 n_world_viewpoint = normalize(world_viewpoint);
    ...
}
```

위 수식에 따라 specular lighting에 의한 빛의 세기와 색깔을 결정하고, 기존에 diffuse lighting으로 구한 결과에 더해줍니다.

```GLSL
void main() {
    ...
    float diffuse_factor   = clamp( dot(n_world_normal, n_light_direction), 0.0, 1.0 );
    float specular_factor  = pow( clamp( dot(n_reflection, n_world_viewpoint), 0.0, 1.0 ), specular_exponent );
    
    out_color = vec4(
        diffuse_factor  * light_intensity * diffuse_intensity  * ( _diffuse_color * light_color )
        + specular_factor * light_intensity * specular_intensity * ( specular_color * light_color ), 
        1.0
    );
}
```

Phong model 대신 Blinn-Phong model을 사용하고 싶으면 `specular_factor`를 계산하는 식을 다음과 같이 고치면 되겠죠.

```GLSL
...
vec3 n_half_angle_direction = normalize( n_world_viewpoint + n_light_direction );
...
float specular_factor = pow( clamp( dot(n_half_angle_direction, n_world_normal), 0.0, 1.0 ), specular_exponent );
...
```

## Ambient Lighting

창문이 하나 뿐인 방에 햇빛이 들어오고 있다고 생각해 봅시다. 물론 햇빛이 직접 비치는 부분이 제일 밝겠지만, 햇빛이 직접 비치지 않는 부분도 아예 보이지 않는 것이 아니라 어둡게나마 볼 수 있습니다. 이는 햇빛이 창문을 통해 방에 들어온 후, 여러 차례 벽과 바닥에 반사되어 이 빛을 볼 수 있기 때문입니다. 컴퓨터 그래픽스에서는 빛이 여러 차례 반사되는 과정을 일일이 계산할 수 없기 때문에, 이처럼 광원이 직접 비치지 않아도 우리 눈에 (또는 가상 카메라에) 들어오는 빛을 **주변광**(ambient light)이라고 합니다. 실제로 빛이 여러 가지 물체에 반사되는 과정을 시뮬레이션하는 알고리즘도 존재합니다만, 복잡하고 많은 최적화가 필요하기 때문에 여기에서는 매우 간단한 ambient lighting 모델을 사용합니다.

Ambient lighting 모델에서는 그냥 같은 세기의 빛이 모든 방향에 존재한다고 가정합니다. 물체의 표면이 바라보는 방향에 상관없이, 

$$I_a = k_a i_a$$

이 식으로 ambient lighting에 의한 빛의 세기가 결정됩니다. $$i_a$$는 주변광의 세기를 (이는 광원이 아니라, 주변 환경에 의해 결정되는 상수입니다.), $$k_a$$는 이 물체가 얼마나 주변광을 반사하는지 나타내는 상수입니다.

GLSL shader 프로그램에서는 fragment shader에 다음과 같은 내용을 추가하세요.

```GLSL
// Fragment shader
...
const float ambient_intensity = 1.0;        // k_a
const float ambient_light_intensity = 0.20; // i_a
const vec3  ambient_light_color = vec3(1, 1, 1);
...
void main() {
    ...
    out_color = vec4(
        diffuse_factor  * light_intensity * diffuse_intensity  * ( _diffuse_color * light_color )
        + specular_factor * light_intensity * specular_intensity * ( specular_color * light_color )
        + ambient_light_intensity * ambient_intensity * ( _diffuse_color * ambient_light_color ),
        1.0
    );
}
```

`out_color`를 계산할 때 diffuse, specular lighting에 의해 들어오는 빛에 더해 ambient lighting에 의한 빛까지 고려하여 계산하면 됩니다.

## Material 클래스 업데이트

지금까지 살펴보았듯, 가상 카메라에 들어오는 물체의 밝기와 색깔은 **물체 자체의 특성**과 **광원의 특성**에 의해 결정됩니다. Fragment shader에서 사용하는 상수들 중, `diffuse_color`, `diffuse_intensity` 등은 물체 자체의 특성이고, `light_color`, `light_intensity` 와 같은 변수들은 광원의 특성입니다. 광원은 이후 튜토리얼에서 엔진에 추가하도록 하고, 여기에서는 물체의 특성을 어플리케이션에서 직접 결정할 수 있도록 `Material` 클래스를 수정하도록 하겠습니다.

Fragment shader에서 사용하는 `Material`의 특성은 다음과 같습니다.
- diffuse lighting
    - `diffuse_color` 또는 texture에서 얻어낸 색깔
    - `diffuse_intensity`
- specular lighting
    - `specular_color`
    - `specular_intensity`
    - `specular_exponent`
- ambient lighting
    - `ambient_intensity`

이 변수들은 우리가 사용하는 shading 모델들을 모두 합친 식에 등장하는 변수들이기도 합니다.

$$I = I_d + I_s + I_a = k_di_l(\hat{N} \cdot \hat{L}) + k_si_l(\hat{R} \cdot \hat{V})^n + k_ai_a$$

이 변수들을 모두 fragment shader에서 **uniform variable**로 지정하고, `Material` 클래스에서 uniform variable에 접근할 수 있는 메소드들을 작성해 줍니다.

```typescript
// src/engine/components/Material.ts
...
diffuse: {
    diffuseColor: { r: number, g: number, b: number },
    diffuseIntensity: number
};
specular: {
    specularColor: { r: number, g: number, b: number },
    specularIntensity: number,
    specularExponent: number
};
ambient: {
    ambientIntensity: number
};
...
start(program: Program): void {
    program.start();
    program.setUniform1f('use_texture', this._texture2D ? 1 : 0);
    if (this._texture2D) {
        this._texture2D.bind(this._gl.TEXTURE0);
        program.setUniform1i('sampler', 0);
    } else {
        program.setUniform3f('diffuse_color', this.diffuse.diffuseColor.r, this.diffuse.diffuseColor.g, this.diffuse.diffuseColor.b);
    }
    program.setUniform1f('diffuse_intensity',  this.diffuse.diffuseIntensity);
    program.setUniform3f('specular_color',     this.specular.specularColor.r, this.specular.specularColor.g, this.specular.specularColor.b);
    program.setUniform1f('specular_intensity', this.specular.specularIntensity);
    program.setUniform1f('specular_exponent',  this.specular.specularExponent);
    program.setUniform1f('ambient_intensity',  this.ambient.ambientIntensity);
}
...
```

## 결과

어플리케이션에서 `material`의 attribute들을 조절하여 여러 가지 효과를 연출해 보세요. 시간에 따라 `color`나 `intensity` 값을 조절하는 것도 가능합니다.

```typescript
// src/main.ts
...
const mainLoop = (time: number) => {
    ...
    material.diffuse.diffuseColor = {
        r: 0.5 * Math.sin(0.0005 * time) + 0.5,
        g: 0.5 * Math.sin(0.0003 * time) + 0.5,
        b: 0.5 * Math.sin(0.0001 * time) + 0.5
    };
    ...
}
...
```

[Preview]({{site.url}}/pages/webgl-tutorials/09-specular-lighting)

## 링크

[GitHub Repository](https://github.com/inhibitor1217/webgl-tutorials/tree/master/tutorials/09-specular-lighting)