---
layout: blog
title: 3.5 GROUP BY, HAVING
date: 2025-08-05 19:00:00 +0900
categories: [TIL, sqld, 3_SQL_기본]
permalink: /blog/posts/25-08-05-TIL-2/
---

### 3.5.1 GROUP BY절

**GROUP BY** : GROUP BY 뒤에 오는 칼럼의 각 값별로 데이터를 그룹핑한다. 매우 부하가 높은 연산이므로 사용 전에 WHERE을 통해 조건 필터링을 수행하는 것이 좋다.

**SELECT ID, SUM(NUM) AS NUMS FROM TEST GROUP BY ID;**<br>
TEST 테이블에서 ID별로 그룹핑을 수행한 뒤 ID별 NUM의 합계를 조회.
<br><br>

### 3.5.2 집계함수

**집계함수** : GROUP BY를 통해 생성된 그룹에 대하여 통계값을 계산하는 함수. GROUP BY 없이 사용한다면 전체 행을 하나의 그룹으로 본다.

<table style="width:75%" border="1">
  <thead>
    <tr>
      <th>함수</th>
      <th>설명</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="width:30%">COUNT</td>
      <td style="width:70%">칼럼에서 값이 존재하는 행의 개수를 반환.</td>
    </tr>
    <tr>
      <td>SUM</td>
      <td>칼럼의 합을 반환.</td>
    </tr>
    <tr>
      <td>AVG</td>
      <td>칼럼의 평균을 반환.</td>
    </tr>
    <tr>
      <td>MIN</td>
      <td>칼럼의 최솟값을 반환.</td>
    </tr>
    <tr>
      <td>MAX</td>
      <td>칼럼의 최댓값을 반환.</td>
    </tr>
  </tbody>
</table>
<br>

### 3.5.3 HAVING절

**HAVING** : 필터링할 조건을 명시하는 구문. WHERE절과 달리 집계함수를 사용할 수 있다. 즉 GROUP BY 연산이 끝난 결과에 대한 필터링을 수행한다.

**SELECT ID FROM TEST GROUP BY ID HAVING COUNT(\*) = 2;**<br>
TEST 테이블에서 ID별로 그룹핑을 수행한 뒤 ID별로 개수가 2개인 ID를 조회.
