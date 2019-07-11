---
layout: post
title: "Runtime Noise Texture 구현"
tags: [Shader, Unity]
---

## Runtime Noise Texture

게임 개발, 이미지 또는 영상 처리에 흔히 사용되는 Noise에 관해 공부하고, Unity 엔진에서 사용하는 `ShaderLab`과 `Cg` Shader 언어로 noise 알고리즘들을 구현하여 real-time으로 적용할 수 있도록 정리해 보았습니다.

> 다음 글들을 참고했습니다.
> - [Catlike Coding - Noise](https://catlikecoding.com/unity/tutorials/noise/)
> - [Scratchapixel - Value Noise and Procedural Patterns: Part 1](https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/procedural-patterns-noise-part-1/simple-pattern-examples)
> - [Scratchapixel - Perlin Noise: Part 2](https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/perlin-noise-part-2)
> - [Unity `ShaderLab` 언어 Reference](https://docs.unity3d.com/Manual/SL-Shader.html)

### Value Noise
#### Shader와 Texture Coordinates

#### Hash Function

### Interpolation
#### Box Interpolation

#### Linear(Bilinear, Trilinear) Interpolation

#### Spline Interpolation

### Fractal Noise

### Perlin Noise

### Evolution