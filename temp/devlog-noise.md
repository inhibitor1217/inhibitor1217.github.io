---
layout: post
title: "Runtime Noise Texture 구현"
tags: [Shader, Unity]
---

## Runtime Noise Texture

게임 개발, 이미지 또는 영상 처리에 흔히 사용되는 Noise에 관해 공부하고, Unity 엔진에서 사용하는 `ShaderLab`과 `Cg` Shader 언어로 noise 알고리즘들을 구현하여 real-time으로 적용할 수 있도록 정리해 보았습니다.

<!--more-->

> 다음 글들을 참고했습니다.
> - [Catlike Coding - Noise](https://catlikecoding.com/unity/tutorials/noise/)
> - [Scratchapixel - Value Noise and Procedural Patterns: Part 1](https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/procedural-patterns-noise-part-1/simple-pattern-examples)
> - [Scratchapixel - Perlin Noise: Part 2](https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/perlin-noise-part-2)
> - [Unity `ShaderLab` 언어 Reference](https://docs.unity3d.com/Manual/SL-Shader.html)

### Value Noise

아마도 noise를 구현하라는 문제에 제일 먼저 떠오르는 방법은 다음과 같은 방법일 것입니다.

```c#
// UnityEngine

Texture2D texture = new Texture2D(WIDTH, HEIGHT);

for (int y = 0; y < HEIGHT; y++) {
    for (int x = 0; x < WIDTH; x++) {
        texture.SetPixel(x, y, Random.value * Color.white);
    }
}

texture.Apply();
```

위의 간단한 코드처럼 모든 픽셀을 0과 1 사이의 랜덤 값으로 채우면, TV가 고장났을 때와 같은 상황에 볼 수 있는 white noise를 생성할 수 있습니다.

![white-noise](https://upload.wikimedia.org/wikipedia/commons/f/f6/White-noise-mv255-240x180.png)
> 이미지 출처: [Wikipedia - White Noise](https://en.wikipedia.org/wiki/White_noise)

이러한 noise를 기본으로 하여 응용하면, 물결, 불, 연기, 구름 등과 같이 우리가 자연에서 볼 수 있는 무작위적인 무늬를 적은 비용으로 표현할 수 있습니다.

#### Shader와 Texture Coordinates

위에서 언급한 코드는 texture의 각 픽셀들에 랜덤 값을 채우는 연산을 CPU에서 수행합니다. 그러나, 이처럼 동일한 연산을 많은 픽셀에 걸쳐 수행하는 일은 GPU에서 할 때 더 효과적입니다. GPU에게 우리가 원하는 작업을 명령하기 위해서는 **shader**라고 하는 특별한 형태의 프로그램을 작성해야 합니다. Shader와 그래픽스 파이프라인의 개념에 관한 자세한 설명은 아래 글을 참조하세요.

> [WebGL Tutorial - 04-1. 그래픽스 파이프라인, Shader, GLSL]({{site.url}}/2019/04/21/webgl-shader)

간단한 Unity 프로젝트와 shader 프로그램을 통해 shader가 어떻게 동작하는지 알아봅시다.

<!--Unity Project 생성, 프로젝트 구조, Quad-->

```ShaderLab
Shader "Noise/Constant"
{
    SubShader
    {
        Cull Off
        Zwrite Off
        Lighting Off

        Pass
        {
            name "Default"

        CGPROGRAM
            #include "UnityCG.cginc"
            #pragma vertex vert
            #pragma fragment frag

            struct appdata_t
            {
                float4 vertex   : POSITION;
                float2 texcoord : TEXCOORD0;
            };

            struct v2f
            {
                float4 vertex   : SV_POSITION;
                float2 texcoord : TEXCOORD0;
            }

            v2f vert(appdata_t v)
            {
                v2f OUT;

                OUT.vertex = v.vertex;
                OUT.texcoord = v.texcoord;

                return OUT;
            }

            half4 frag(v2f IN) : SV_Target
            {
                half4 color;

                color.rgb = .5 * half3(1, 1, 1, 1);

                return color;
            }
        ENDCG
        }
    }
}
```

위의 shader에서는 fragment shader에서 항상  `(r, g, b, a) = (.5, .5, .5, 1)` 값을 `return`합니다. 따라서 아래 그림처럼 모든 픽셀이 회색을 띄게 됩니다.

<!--figure-->

Fragment shader에서는 픽셀(fragment)의 texture coordinate에 접근할 수 있습니다. 그래픽스 파이프라인에서는 vertex attribute로 각 vertex마다 texture coordinate가 주어지고, vertex shader에서 이 값을 fragment shader로 넘겨줍니다. 위 코드에서는 vertex shader의 input인 `appdata_t.texcoord`가 vertex attribute로 주어지는 값에 해당하고, 이를 `v2f.texcoord`로 넘겨주어 fragment shader에서 받게 됩니다.

우리가 shader를 사용해서 그리는 quad는 `[0, 1] * [0, 1]`의 texture coordinate 영역에 존재합니다. 여기에 **체크무늬**를 그리려면 fragment shader를 어떻게 작성해야 할까요?

```cg
half4 frag(v2f IN) : SV_Target
{
    half4 color;

    int2 coords = floor(IN.texcoord * 8);
    float value = (coords.x + coords.y) & 1 ? 0 : 1;
    
    return value * half4(1, 1, 1, 1);
}
```

이 shader 코드는 CPU에서 for-loop를 돌며 texture의 픽셀의 각 값을 채우는 아래 코드와 동일한 작업을 수행합니다.

```c#
// UnityEngine

Texture2D texture = new Texture2D(WIDTH, HEIGHT);

for (int y = 0; y < HEIGHT; y++) {
    for (int x = 0; x < WIDTH; x++) {

        int xCoord = Mathf.floor(((float)x / (float)width) * 8f);
        int yCoord = Mathf.floor(((float)y / (float)height) * 8f);

        float value = (xCoord + yCoord) & 1 ? 0 : 1;

        texture.SetPixel(x, y, value * Color.white);
        
    }
}

texture.Apply();
```

#### Hash Function

### Interpolation
#### Box Interpolation

#### Linear(Bilinear, Trilinear) Interpolation

#### Spline Interpolation

### Fractal Noise

### Perlin Noise

### Evolution