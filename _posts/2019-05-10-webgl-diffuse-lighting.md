---
layout: post
title: "[WebGL] 08. Diffuse Lighting"
tags: [WebGL, Shader, Lighting]
---
## Diffuse Lighting

> [WebGL 튜토리얼 목록]({{site.url}}/1_webgl-tutorials)

[앞 튜토리얼]({{site.url}}/2019/05/07/webgl-view-projection)에서 3D 물체를 가상 카메라를 활용하여 렌더링하는 방법에 대해 알아보았습니다. 하지만, 아직 빛과 그림자를 추가하지 않았기 때문에 3D 물체라도 다소 평면적으로 보입니다. 이번에는 입체감을 더욱 살릴 수 있도록 물체의 밝고 어두운 부분을 나타내 보도록 하겠습니다.

<!--more-->

### Shading

![wiki-shading-1](https://upload.wikimedia.org/wikipedia/commons/8/84/Phong-shading-sample.jpg)

> 이미지 출처: [Wikipedia - Shading](https://en.wikipedia.org/wiki/Shading)

**Shading**이란 3D 공간에서 가상의 빛과 그림자가 있다고 생각하여, 물체의 밝고 어두운 부분을 계산하여 입체감을 부여하는 기법을 말합니다. 물론, 실제 우리가 물체를 보는 것처럼 가상의 광원으로부터 모든 빛의 경로를 시뮬레이션하여 카메라에 들어오는 빛을 계산해 이를 구현할 수 있습니다. 그러나, 컴퓨터 그래픽스에서는 수십년 동안 제한된 컴퓨팅 자원으로 현실적인 shading을 구현하기 위해 (또는 의도적으로 비현실적인 shading을 구현하기 위해) 많은 기법들이 개발되었습니다.

이 튜토리얼과 이어지는 글들에서는 **diffuse lighting**, **specular lighting**, **ambient lighting**에 관해 알아보고, 이를 적용한 GLSL 프로그램을 작성하여 엔진에 포함시키도록 하겠습니다.

### Diffuse lighting - Lambert's Cosine Law

언젠가 과학 시간에 **정반사**(specular reflection)와 **난반사**(diffuse reflection)에 대해 들어본 적이 있을 것입니다. 정반사가 일어나는 거울과 같은 매끈한 표면에서는 입사된 빛을 일정한 방향으로 반사하는데, 난반사가 일어나는 울퉁불퉁한 표면에서는 여러 방향으로 빛을 반사합니다. 우리가 일상에서 보는 대부분의 물체들은 난반사가 일어나는 표면을 가지고 있습니다.

![wiki-diffuse-1](https://upload.wikimedia.org/wikipedia/commons/b/bd/Lambert2.gif)
> 이미지 출처: [Wikipedia - Diffuse Reflection](https://en.wikipedia.org/wiki/Diffuse_reflection)

컴퓨터 그래픽스에서는 이 메커니즘을 충분히 사실적으로 (그렇지만 효율적으로) 묘사하기 위해 다음 식을 사용합니다.

$$I_{d} = k_{d} I_l (\hat{N} \cdot \hat{L} )$$

> [Wikipedia - Lambertian Reflectance](https://en.wikipedia.org/wiki/Lambertian_reflectance)

우리에게 보이는 색의 밝기는 빛의 입사 방향 $$\hat{L}$$과 표면의 법선(normal) 벡터 $$\hat{N}$$의 내적에 비례합니다. 위의 그림에서 볼 수 있듯, **빛이 표면과 수직하게 입사할수록 더 밝은 색깔로 나타나는 것이죠**. 이와 같이, 반사된 빛의 양이 빛의 입사 방향과 normal 벡터 사이의 각도의 코사인에 비례하는 법칙을 Lambert's cosine law라고 합니다.

실제 빛은 가시광선 영역의 여러 파장의 빛들이 섞여 있지만, 컴퓨터 그래픽스에서는 3가지 파장의 (빨강, 초록, 파랑) 빛으로 이것을 압축합니다. (실제로 사람의 눈은 3가지 파장 영역을 담당하는 세포로 색을 구별하기 때문에 충분합니다!) 물체의 색깔은 그 물체가 특정 파장의 빛을 얼마나 반사하는지에 따라 결정됩니다. 예를 들어, 우리에게 (흰색 빛을 받았을 때) 빨간색으로 보이는 물체는 빨간색 파장의 빛을 많이 반사하고, 초록색과 파란색 빛은 반사하지 않기 때문에 그렇게 보이는 것이죠. 컴퓨터 그래픽스에서 이를 구현할 때도 마찬가지의 원리로 구현하면 됩니다. 물체마다 위 식에서 $$k_d$$ 값을 빨강, 초록, 파란색마다 다르게 하여 '물체의 색깔'을 표현하는 것입니다.

$$I_{d, red} = k_{d, red} I_{l, red} (\hat{N} \cdot \hat{L} )$$

$$I_{d, green} = k_{d, green} I_{l, green} (\hat{N} \cdot \hat{L} )$$

$$I_{d, blue} = k_{d, blue} I_{l, blue} (\hat{N} \cdot \hat{L} )$$

### Shader 프로그램 작성

이 식을 shader 프로그램에 적용하여 diffuse lighting을 구현합시다. Shader 프로그램에서 물체 표면의 법선 벡터에 접근할 수 있도록 법선 벡터를 vertex attribute로 넘겨줍니다.

```GLSL
// Vertex Shader
...
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 uv;
```
Model coordinate에서의 법선 벡터를 transformation으로 변환하여 world coordinate 기준으로 나타내고, 이를 fragment shader에 넘겨줍니다.
```GLSL
...
out vec2 pass_uv;
out vec3 world_normal;
...
void main() {
    ...
    world_normal = vec3(transformation * vec4(normal, 0));
}
```

Fragment shader에서는 위의 식에 따라 표면에서 반사되는 빛의 세기와 색깔을 결정합니다. 우리는 아직 엔진에서 '광원'을 디자인하지 않았기 때문에, 우선 빛의 입사 방향, 세기, 색깔을 상수로 설정하도록 합시다.

```GLSL
// Fragment Shader
...
const vec3  light_direction = vec3(0, 0, 1);
const float light_intensity = 1.0;
const vec3  light_color = vec3(1, 1, 1);
...
```

위의 식에 따라 `out_color`를 계산하는 코드를 작성하세요.

```GLSL
void main() {

    vec3 _diffuse_color = mix(vec4(color, 1), texture(sampler, pass_uv), use_texture).xyz;
    
    vec3 n_world_normal    = normalize(world_normal);
    vec3 n_light_direction = normalize(light_direction);
    float diffuse_factor   = clamp( dot(n_world_normal, n_light_direction), 0.0, 1.0 );
    
    out_color = vec4(diffuse_factor * light_intensity * diffuse_intensity * (_diffuse_color * light_color), 1.0);
    
}
```

### 결과

새로 작성한 shader 프로그램을 확인하기 전, 이전 튜토리얼에서 작성한 정육면체 모델의 데이터가 각 면의 법선 벡터 또한 가지고 있도록 다음 내용으로 교체하세요.

```typescript
const mesh = new Mesh();
mesh.updateVertexBuffer(new Float32Array([
    -0.5, -0.5, -0.5,  0,  0, -1,  0, 0,
    -0.5,  0.5, -0.5,  0,  0, -1,  0, 1,
     0.5, -0.5, -0.5,  0,  0, -1,  1, 0,
     0.5,  0.5, -0.5,  0,  0, -1,  1, 1,
    -0.5, -0.5,  0.5,  0,  0,  1,  0, 0,
    -0.5,  0.5,  0.5,  0,  0,  1,  0, 1,
     0.5, -0.5,  0.5,  0,  0,  1,  1, 0,
     0.5,  0.5,  0.5,  0,  0,  1,  1, 1,
    -0.5, -0.5, -0.5, -1,  0,  0,  0, 0,
    -0.5, -0.5,  0.5, -1,  0,  0,  0, 1,
    -0.5,  0.5, -0.5, -1,  0,  0,  1, 0,
    -0.5,  0.5,  0.5, -1,  0,  0,  1, 1,
     0.5, -0.5, -0.5,  1,  0,  0,  0, 0,
     0.5, -0.5,  0.5,  1,  0,  0,  0, 1,
     0.5,  0.5, -0.5,  1,  0,  0,  1, 0,
     0.5,  0.5,  0.5,  1,  0,  0,  1, 1,
    -0.5, -0.5, -0.5,  0, -1,  0,  0, 0,
    -0.5, -0.5,  0.5,  0, -1,  0,  0, 1,
     0.5, -0.5, -0.5,  0, -1,  0,  1, 0,
     0.5, -0.5,  0.5,  0, -1,  0,  1, 1,
    -0.5,  0.5, -0.5,  0,  1,  0,  0, 0,
    -0.5,  0.5,  0.5,  0,  1,  0,  0, 1,
     0.5,  0.5, -0.5,  0,  1,  0,  1, 0,
     0.5,  0.5,  0.5,  0,  1,  0,  1, 1,
]));
mesh.updateIndexBuffer(new Uint32Array([
     0,  1,  3,  0,  3,  2,
     4,  7,  5,  4,  6,  7,
     8, 11, 10,  8,  9, 11,
    12, 14, 15, 12, 15, 13,
    16, 19, 17, 16, 18, 19,
    20, 21, 23, 20, 23, 22,
]));
mesh.configure([[gl.FLOAT, 3], [gl.FLOAT, 3], [gl.FLOAT, 2]]);
mesh.setCount(36);
```

[Preview]({{site.url}}/pages/webgl-tutorials/08-diffuse-lighting)

이전 튜토리얼의 [Preview]({{site.url}}/pages/webgl-tutorials/07-view-projection)과 비교하면, 정육면체의 각 면의 밝기에 차이가 있어 좀 더 자연스러운 것을 느낄 수 있습니다.

이 튜토리얼에서는 기본적인 shader에서 diffuse lighting을 어떻게 다루는지 Lambertian model을 통해 알아보았습니다. 다음 튜토리얼에서는 여기에 더하여 specular lighting과 ambient lighting을 추가하여 기본 shader를 완성해 보도록 하겠습니다.

### 링크

[GitHub Repository](https://github.com/inhibitor1217/webgl-tutorials/tree/master/tutorials/08-diffuse-lighting)