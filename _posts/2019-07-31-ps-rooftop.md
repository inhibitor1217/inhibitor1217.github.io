---
layout: post
title: "[PS] 옥상 정원 꾸미기 (rooftop)"
tags: [PS, USACO, Stack]
---
## 옥상 정원 꾸미기 (rooftop) - USACO 2006 November (Silver)

### 문제

도로를 따라 일렬로 지어진 N개의 빌딩에는 모두 옥상 정원이 있다. 빌딩 관리인들은 매우 성실하기 때문에, 다른 빌딩의 옥상 정원을 보고 벤치마킹 하고 싶어한다.

빌딩의 구조 때문에 관리인들은 자신보다 오른쪽에 있는 빌딩 중 더 낮은 빌딩의 옥상만 볼 수 있다. 또, 당연하게도 높이가 자기 빌딩보다 높거나 같은 빌딩이 있으면 그 너머에 있는 빌딩들도 볼 수 없다.

<!--more-->

예를 들어, 6개의 빌딩의 높이가 각각 10, 3, 7, 4, 12, 2 인 경우,

- 1번째 빌딩의 관리인은 2, 3, 4번째 빌딩의 옥상을 확인할 수 있다.
- 2번째 빌딩의 관리인은 다른 빌딩의 옥상을 확인할 수 없다.
- 3번째 빌딩의 관리인은 4번째 빌딩의 옥상을 확인할 수 있다.
- 4번째 빌딩의 관리인은 다른 빌딩의 옥상을 확인할 수 없다.
- 5번째 빌딩의 관리인은 6번째 빌딩의 옥상을 확인할 수 있다.
- 6번째 빌딩의 관리인은 맨 오른쪽이므로 다른 빌딩의 옥상을 확인할 수 없다.

이처럼, 빌딩의 개수 N과 각각의 높이가 주어졌을 때, 각 빌딩의 관리인들이 옥상을 볼 수 있는 빌딩의 수를 구하시오.

#### 예시

문제에서 주어진 상황의 경우, 각 빌딩의 관리인들은 각각 `[3, 0, 1, 0, 1, 0]`개의 옥상을 확인할 수 있다.

### 관찰

문제에서 제시된 상황에 따라, 각 빌딩에서 볼 수 있는 빌딩들을 일일이 세어 봅시다. 각 빌딩에서, 자신의 오른쪽 빌딩들 중 자신보다 높이가 높거나 같은 빌딩이 나올 때까지 개수를 세면 됩니다. 이 과정을 간단한 코드로 작성해 보았습니다.

```python
# 각 빌딩들의 높이들의 리스트인 buildings에서,
# i번째 빌딩 관리인이 볼 수 있는 빌딩의 수를 구하는 함수
def count(buildings, i):
    cnt = 0
    # 내가 i번째 빌딩 관리인일 때,
    # (i+1)번째 빌딩, (i+2)번째 빌딩, ... 을 차례로 비교한다.
    for j in range(i+1, len(buildings)):
        # 만약 자신보다 작은 빌딩이라면, 센다.
        if buildings[i] > buildings[j]:
            cnt = cnt + 1
        # 자신보다 크거나 같은 빌딩이 나오면 멈춘다.
        else:
            break
    return cnt
```

### 풀이

첫 번째 풀이에서는 문제 조건을 그대로 활용하여 정확한 답을 구하는 프로그램을 작성하는 데 성공했습니다. 그런데, 다른 풀이를 고민해야 하는 이유는 무엇일까요? 더 효율적으로 답을 구하는 방법이 존재하기 때문입니다. 정확한 답을 구할 수 있는 다른 풀이에 대해 알아보고 두 풀이의 시간 복잡도 분석을 통해 두 풀이를 비교해 봅시다.

#### 새로운 접근

두 번째 풀이의 핵심 아이디어는 문제에서 나왔던, 다음과 같은 성질입니다.

- 또, 당연하게도 높이가 자기 빌딩보다 높거나 같은 빌딩이 있으면 그 너머에 있는 빌딩들도 볼 수 없다.

이 말을 더 자세히 풀이해 봅시다. 만약 빌딩 A에서 오른쪽으로 가면서 A보다 높거나 동일한 높이의 빌딩을 최초로 만났을 때, 그 빌딩을 B라고 합시다. 그렇다면, **A와 B 사이의 모든 빌딩은 A보다 높이가 낮기 때문에 빌딩 A에서는 A와 B 사이의 모든 빌딩의 옥상을 볼 수 있습니다**. 문제의 예시를 통해서도 알아봅시다.

| 빌딩 번호 | 자신보다 오른쪽에 있으면서,<br> 높이가 높거나 같은 최초의 빌딩 | 볼 수 있는 빌딩들 |
| :-: | :-: | :-: |
| 1번 (10) | 5번 (12) | 2, 3, 4번 = 1~5번 사이 |
| 2번 (3) | 3번 (7) | 없음 = 2~3번 사이 |
| 3번 (7) | 5번 (12) | 4번 = 3~5번 사이 |
| 4번 (4) | 5번 (12) | 없음 = 4~5번 사이 |
| 5번 (12) | - | 6번 |
| 6번 (2) | - | 없음 |

5, 6번 빌딩의 경우, 자신보다 오른쪽에 있으면서 높이가 높거나 같은 최초의 빌딩이 존재하지 않습니다. 이 성질에서 예외인 경우가 되는데요, 사실 이 경우는 **맨 오른쪽에 높이가 매우 높은 빌딩이 존재한다고 가정하면** 모든 빌딩에 대해 이 성질이 성립하게 됩니다.

| 빌딩 번호 | 자신보다 오른쪽에 있으면서,<br> 높이가 높거나 같은 최초의 빌딩 | 볼 수 있는 빌딩들 |
| :-: | :-: | :-: |
| 1번 (10) | 5번 (12) | 2, 3, 4번 = 1~5번 사이 |
| 2번 (3) | 3번 (7) | 없음 = 2~3번 사이 |
| 3번 (7) | 5번 (12) | 4번 = 3~5번 사이 |
| 4번 (4) | 5번 (12) | 없음 = 4~5번 사이 |
| 5번 (12) | 7번 ($$\infty$$) | 6번 = 5~7번 사이 |
| 6번 (2) | 7번 ($$\infty$$) | 없음 = 6~7번 사이 |

이제 모든 빌딩에 대해 “자신보다 오른쪽에 있으면서, 높이가 높거나 같은 최초의 빌딩”을 구하는 것이 관건이 됩니다. 하지만, 제일 먼저 떠오르는 대로 각 빌딩마다 오른쪽으로 한 칸씩 전진하면서 높이를 일일이 비교해 보는 것은 이전의 풀이보다 효율성이 나아지는 측면이 없습니다. 어떻게 해야 빠르게 구할 수 있을까요?

#### 스택(stack)을 활용한 풀이

일일이 탐색하는 방식이 나쁜 이유는 각 빌딩에 대해 자신보다 오른쪽에 있는 모든 빌딩이 “자신보다 오른쪽에 있으면서, 높이가 높거나 같은 최초의 빌딩”의 후보이기 때문입니다. 따라서, 이 후보군을 줄여야 탐색의 횟수를 줄일 수 있습니다. 후보를 줄이기 위해 이번에는 다음과 같은 성질에 주목해 봅시다.

- 빌딩 A가 빌딩 B보다 왼쪽에 있고, A의 높이가 B보다 더 높거나 같은 경우를 생각해 봅시다. 그러면, B는 어떠한 경우에도 A보다 왼쪽에 있는 빌딩의 “자신보다 오른쪽에 있으면서, 높이가 높거나 같은 최초의 빌딩”이 될 수 없습니다.

문제에서 주어진 예제에서 맨 오른쪽 빌딩부터 왼쪽으로 가면서, 이 성질을 적용하여 후보 리스트의 크기를 줄여 봅시다.

- 7번 빌딩
    - 리스트에 7번 빌딩을 추가합니다. `[7번(∞)]`
- 6번 빌딩
    - 리스트를 보면 7번 빌딩이 “자신보다 오른쪽에 있으면서, 높이가 높거나 같은 최초의 빌딩”이 됩니다. 
    - 6번 빌딩도 리스트에 추가합니다. `[7번(∞), 6번(2)]`
- 5번 빌딩
    - 리스트를 보면 마찬가지로 7번 빌딩이 “자신보다 오른쪽에 있으면서, 높이가 높거나 같은 최초의 빌딩”이 됩니다. 
    - 5번 빌딩도 리스트에 추가하면, 6번 빌딩이 위의 성질에 의해 후보군에서 제외됨을 알 수 있습니다. `[7번(∞), 5번(12)]`
- 4번 빌딩
    - 리스트를 통해 5번 빌딩이 원하는 빌딩임을 알아냅니다.
    - 4번 빌딩을 리스트에 추가합니다. 5번 빌딩은 4번보다 오른쪽에 있지만 더 높으므로 후보군에서 제외되지 않습니다. `[7번(∞), 5번(12), 4번(4)]`
- 3번 빌딩
    - 리스트를 통해 5번 빌딩이 원하는 빌딩임을 알아냅니다.
    - 3번 빌딩을 리스트에 추가하면, 4번 빌딩이 위 성질에 의해 리스트에서 먼저 제외되어야 합니다. `[7번(∞), 5번(12), 3번(7)]`
- 2번 빌딩
    - 리스트를 통해 3번 빌딩을 찾습니다.
    - 2번 빌딩을 리스트에 추가합니다. `[7번(∞), 5번(12), 3번(7), 2번(3)]`
- 1번 빌딩
    - 리스트를 통해 5번 빌딩을 찾습니다.
    - 1번 빌딩을 리스트에 추가하려면, 2, 3번 빌딩이 리스트에서 제외되어야 합니다. `[7번(∞), 5번(12), 1번(10)]`

다른 예시로도 직접 연습해 보시기 바랍니다. 빌딩의 높이를 차례로 `[10, 2, 4, 7, 8, 5]`라고 할 때, 후보 리스트의 변화는 다음과 같습니다

- 7번 빌딩: `[7번(∞)]`
- 6번 빌딩: `[7번(∞), 6번(5)]`
- 5번 빌딩: `[7번(∞), 5번(8)]`
- 4번 빌딩: `[7번(∞), 5번(8), 4번(7)]`
- 3번 빌딩: `[7번(∞), 5번(8), 4번(7), 3번(4)]`
- 2번 빌딩: `[7번(∞), 5번(8), 4번(7), 3번(4), 2번(2)]`
- 1번 빌딩: `[7번(∞), 1번(10)]`

두 개의 예시를 보면, 후보 리스트에 속한 빌딩들의 번호와 높이가 내림차순이라는 사실 또한 알 수 있습니다. 빌딩 번호는 물론 오른쪽에서부터 빌딩을 차례대로 보았으니 내림차순인 것이 당연하고, 높이가 내림차순인 것은 앞서 언급한 성질에 의해 높이가 더 낮으면서 오른쪽에 있는 빌딩을 계속해서 리스트에서 제외했기 때문입니다. **리스트의 맨 오른쪽에 있는 빌딩들이 낮으므로, 리스트를 오른쪽부터 보며 제외할 수 있는 빌딩들을 제외해 나가면, 제외할 수 없는 빌딩이 우리가 원하는 “자신보다 오른쪽에 있으면서, 높이가 높거나 같은 최초의 빌딩”이 됩니다!**

이제 알고리즘을 설계할 수 있을 것입니다. 오른쪽부터 차례로 각 빌딩을 보면서, 다음과 같은 일을 합니다.

- 먼저, 리스트의 오른쪽부터 현재 빌딩과 높이가 같거나 낮은 빌딩들을 제외해 나간다.
- 제외할 수 없는 빌딩(= 더 높은 빌딩)이 “자신보다 오른쪽에 있으면서, 높이가 높거나 같은 최초의 빌딩”이 된다. 이를 통해 현재 빌딩에서 볼 수 있는 빌딩의 수를 구할 수 있다.
- 마지막으로, 현재 빌딩을 후보 리스트의 오른쪽에 추가한다.

이와 같은 알고리즘을 코드로 작성하면 다음과 같습니다.

```python
def solve(buildings, n):
    # 맨 오른쪽에 매우 높은 빌딩이 하나 더 있다고 가정한다.
    buildings.append(math.inf)
 
    list = [n]     # 현재 후보 빌딩들의 리스트
    ans  = [0] * n # 정답 (볼 수 있는 빌딩의 수) 리스트
 
    for i in range(n)[::-1]:
        # 먼저, 현재 빌딩보다 높이가 낮거나 같은 빌딩들을 목록에서 제외한다.
        # 목록의 맨 오른쪽부터 체크하면 된다.
        while len(list) > 0 and buildings[list[-1]] <= buildings[i]:
            list.pop()
        
        # 정답을 기록한다.
        ans[i] = list[-1] - i - 1
 
        # 현재 빌딩을 목록에 추가한다.
        list.append(i)
 
    return ans
```

이처럼, 목록의 맨 오른쪽에서만 추가와 제외가 일어나는 규칙을 활용하여 새로운 풀이를 완성할 수 있었습니다. 컴퓨터과학에서 이러한 자료구조를 **스택(Stack)**이라고 부릅니다. 기본적으로 스택은 리스트와 비슷하게 자료를 나열하여 가지고 있는 자료구조이지만, 다음과 같은 연산이 가능합니다.

- 목록(스택)의 맨 오른쪽에 데이터를 추가한다. (삽입, Push)
- 목록(스택)의 맨 오른쪽에서 데이터를 제외한다. (삭제, Pop)
- 목록(스택)의 맨 오른쪽 데이터를 확인한다.

스택을 보통 비유할 때 책들이 쌓여 있는 선반에 비유합니다. 맨 위에 새로운 책을 쌓을 수 있고, 맨 위의 책을 선반에서 꺼낼 수 있지만, 선반의 중간에서 책을 꺼낼 수는 없기 때문입니다. 또, 항상 맨 마지막에 놓인 책이 가장 먼저 선반에서 제외될 수 있다는 성질도 있습니다. 이러한 성질을 LIFO(Last-In-First-Out)이라고 부르는데, 유사한 구조를 가진 큐(Queue)와 쉽게 비교하기 위해 언급하는 특징입니다.

때로는 더 제한적이지만, 특별한 규칙을 가진 자료구조를 활용할 때 더 좋은 풀이를 생각할 수 있음을 잘 보여주는 문제라고 생각합니다.

#### 시간 복잡도 분석

첫 번째 풀이에서는, 각 빌딩에서 다른 빌딩이 보이는지 여부를 일일이 체크하여 각 빌딩에서 보이는 빌딩의 개수를 세었습니다. 따라서, 빌딩의 개수가 $$N$$개라면, 최대 $$N(N-1)/2$$ 번 체크해야 올바른 답을 얻을 수 있습니다. 따라서, 첫 번째 풀이의 연산 횟수는 N에 관한 이차함수 형태로 나타납니다. ($$O(N^2)$$)

두 번째 풀이에서는 “자신보다 오른쪽에 있으면서, 높이가 높거나 같은 최초의 빌딩”의 후보군을 생각하며 문제에 접근했습니다. 각 빌딩마다 자신보다 오른쪽에 있는 모든 빌딩을 살펴보는 방법은 첫 번째 풀이의 시간 복잡도와 차이가 나지 않습니다. 그러나, 스택을 이용한 풀이는 더 나은 시간 복잡도를 가지는데, 앞서 설명한 이 성질 때문입니다.

- 빌딩 A가 빌딩 B보다 왼쪽에 있고, A의 높이가 B보다 더 높거나 같은 경우를 생각해 봅시다. 그러면, B는 어떠한 경우에도 A보다 왼쪽에 있는 빌딩의 “자신보다 오른쪽에 있으면서, 높이가 높거나 같은 최초의 빌딩”이 될 수 없습니다.

한 빌딩은 후보군(스택)에서 최대 한 번 나타나고 (그 빌딩을 탐색할 때), 최대 한 번 삭제됩니다 (그 빌딩보다 크거나 같은 빌딩이 나타났을 때). 또한, 빌딩이 목록의 중간에 존재하는 동안에는 그 빌딩에 대해 높이를 비교하지 않습니다. 따라서, 높이를 비교하는 것은 그 빌딩이 목록에 나타날 때 한 번, 삭제될 때 한 번, 빌딩마다 최대 2번 일어납니다. 즉, 전체적으로 $$2N$$번의 체크가 일어나는 것입니다. 따라서, 두 번째 풀이의 연산 횟수는 N에 관한 일차함수 형태이며 ($$O(N)$$), 첫 번째 풀이보다 월등히 빠르게 결과를 보여줍니다.

### 입력/출력 예제

#### 입력 형식

- 첫 번째 줄에는 빌딩의 개수 N이 입력된다. (1 <= N <= 80,000)
- 두 번째 줄부터, N개의 줄에 한 줄마다 각 빌딩의 높이가 차례로 입력된다. (1 <= 높이 <= 1,000,000,000)

#### 출력 형식

N개의 줄에, 각 빌딩의 관리자들이 옥상을 볼 수 있는 빌딩의 수를 출력한다.

#### 입력 예제 1

```
6
10
3
7
4
12
2
```

#### 출력 예제 1

```
3
0
1
0
1
0
```

### 원문

Some of Farmer John's N cows (1 <= N <= 80,000) are having a bad hair day! Since each cow is self-conscious about her messy hairstyle, FJ wants to count the number of other cows that can see the top of other cows' heads.

Each cow i has a specified height h[i] (1 <= h[i] <= 1,000,000,000) and is standing in a line of cows all facing east (to the right in our diagrams). Therefore, cow i can see the tops of the heads of cows in front of her (namely cows i+1, i+2, and so on), for as long as these cows are strictly shorter than cow i.

Consider this example:

![en-1]({{site.url}}/images/ps-rooftop-en-1.PNG)

- Cow#1 can see the hairstyle of cows #2, 3, 4
- Cow#2 can see no cow's hairstyle
- Cow#3 can see the hairstyle of cow #4
- Cow#4 can see no cow's hairstyle
- Cow#5 can see the hairstyle of cow 6
- Cow#6 can see no cows at all!

Let c[i] denote the number of cows whose hairstyle is visible from cow i; please compute the sum of c[1] through c[N]. For this example, the desired is answer 3 + 0 + 1 + 0 + 1 + 0 = 5.

### 출처
**USA Computing Olympiad, 2006 November Contest**, Silver, Problem 1 (Bad Hair Day)
- 번역 참조: [백준 온라인 저지 (BOJ) - 옥상 정원 꾸미기 (#6198)](https://www.acmicpc.net/problem/6198)