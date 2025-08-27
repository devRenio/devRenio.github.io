---
layout: blog
title: 3.6 ORDER BY
date: 2025-08-05 20:00:00 +0900
categories: [TIL, sqld, 3_SQL_기본]
permalink: /blog/posts/25-08-05-TIL-3/
---

### 3.6.1 ORDER BY절

**ORDER BY** : SELECT문 사용 시에 정렬을 수행한다. 정렬하지 않을 경우 튜플이 임의의 순서로 출력되는 것을 방지하기 위해 사용한다. 집계함수를 사용할 수 있다.

**ORDER BY 칼럼 [ASC / DESC]** : ASC(오름차순), DESC(내림차순). 기본값은 ASC.

**SELECT ID, NAME, ADDRESS FROM STUDENT ORDER BY ID;**<br>
STUDENT 테이블에서 ID, NAME, ADDRESS를 조회하여 ID 순으로 정렬.

**SELECT NAME, MATH, ENG, MATH+ENG AS TOTAL FROM SCORE ORDER BY TOTAL DESC;**<br>
SCORE 테이블에서 NAME, MATH, ENG, TOTAL(MATH+ENG)를 조회하여 TOTAL 순으로 내림차순 정렬.
