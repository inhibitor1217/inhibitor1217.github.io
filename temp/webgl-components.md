---
layout: post
title: "[WebGL] 10. Object, Component"
tags: [WebGL]
---
## Object, Component

> [WebGL 튜토리얼 목록]({{site.url}}/1_webgl-tutorials)

<!--more-->

### Object 추상화


### Component 기반 구조


### Component 클래스


### Object 클래스


### Shader Program 관리

```typescript
import Program from 'engine/shaders/Program';

export default (
    () => {

        const _programs: {[key: string]: Program} = {};
        const _programList = [ 'DefaultShader' ];
        const _activeProgram: Program = null;

        return {

            init(): void {
                
            },

            

            delete(): void {
                
            }

        };

    }
)();
```

