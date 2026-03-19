---
---
const featuredPosts = [
  {% comment %} 1. 보여주고 싶은 카테고리 이름을 순서대로 적으세요 (쉼표로 구분) {% endcomment %}
  {% assign target_categories = "LECTURE,TIL,COTE,TECH" | split: "," %}
  {% assign is_first = true %}

  {% for target_cat in target_categories %}
    {% comment %} 2. 각 카테고리별로 최신 글 하나를 찾습니다 {% endcomment %}
    {% assign latest_post = site.blog | reverse | find: "categories", target_cat %}
    
    {% if latest_post %}
      {% unless is_first %},{% endunless %}
      {
        "title": {{ latest_post.title | jsonify }},
        "url": {{ latest_post.url | relative_url | jsonify }},
        "category": {{ target_cat | strip | jsonify }}
      }
      {% assign is_first = false %}
    {% endif %}
  {% endfor %}
];

console.log("지정된 카테고리별 최신글:", featuredPosts);