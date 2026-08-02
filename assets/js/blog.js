/* 블로그 페이지 전용. 랜딩에서는 로드하지 않는다. */

document.addEventListener("DOMContentLoaded", function () {
  const selected = new URLSearchParams(window.location.search).get("category");

  document.querySelectorAll(".category-list > li > a").forEach((link) => {
    if (selected && link.href.includes(`category=${selected}`)) {
      link.classList.add("active-category");
      const toggle = link.previousElementSibling;
      if (toggle && toggle.classList.contains("category-toggle")) {
        toggle.classList.add("open");
        const ul = link.nextElementSibling;
        if (ul && ul.classList.contains("subcategory-list")) {
          ul.style.display = "block";
        }
      }
    }
  });

  const titleEl = document.getElementById("category-title");
  if (selected && titleEl) {
    titleEl.innerHTML = `<b>카테고리 - ${selected}</b>`;
  }

  document.querySelectorAll(".category-toggle").forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const list = this.parentElement.querySelector(".subcategory-list");
      if (!list) return;
      const open = list.style.display === "block";
      list.style.display = open ? "none" : "block";
      this.textContent = open ? "▼" : "▲";
      this.classList.toggle("open", !open);
    });
  });
});

const pageSize = 5;
let currentPage = 1;

function applyPaginationAndFilter(category) {
  const posts = Array.from(document.querySelectorAll(".blog-entry"));
  const paginationContainer = document.querySelector(".pagination");

  const filteredPosts = category
    ? posts.filter((post) => {
        const categories = (post.dataset.categories || "").split(",");
        return categories.includes(category);
      })
    : posts;

  const totalPages = Math.ceil(filteredPosts.length / pageSize);
  posts.forEach((p) => (p.style.display = "none"));
  filteredPosts
    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
    .forEach((p) => (p.style.display = "block"));

  if (paginationContainer) paginationContainer.innerHTML = "";
  if (!paginationContainer || totalPages <= 1) return;

  const goTo = (page) => {
    currentPage = page;
    applyPaginationAndFilter(category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const createPageBtn = (label, page = null, isCurrent = false) => {
    const el = document.createElement("a");
    el.href = "#";
    el.textContent = label;
    el.className = isCurrent ? "page-number current" : "page-number";
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (page !== null) goTo(page);
    });
    return el;
  };

  const createEllipsis = () => {
    const span = document.createElement("span");
    span.className = "page-ellipsis";
    span.textContent = "...";
    return span;
  };

  const createStepBtn = (label, delta) => {
    const el = document.createElement("a");
    el.href = "#";
    el.innerText = label;
    el.className = "prev-next-button";
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const next = currentPage + delta;
      if (next >= 1 && next <= totalPages) goTo(next);
    });
    return el;
  };

  paginationContainer.appendChild(createStepBtn("◀", -1));

  const windowSize = 2;
  const start = Math.max(1, currentPage - windowSize);
  const end = Math.min(totalPages, currentPage + windowSize);

  if (start > 1) {
    paginationContainer.appendChild(createPageBtn("1", 1));
    if (start > 2) paginationContainer.appendChild(createEllipsis());
  }

  for (let i = start; i <= end; i++) {
    paginationContainer.appendChild(createPageBtn(i, i, i === currentPage));
  }

  if (end < totalPages) {
    if (end < totalPages - 1) paginationContainer.appendChild(createEllipsis());
    paginationContainer.appendChild(createPageBtn(totalPages, totalPages));
  }

  paginationContainer.appendChild(createStepBtn("▶", 1));
}

// 카테고리 파라미터가 있을 때만 목록을 걸러낸다.
// 파라미터가 없으면 blog/index.html의 검색 스크립트가 페이지네이션을 담당한다.
const initialCategory = new URLSearchParams(window.location.search).get(
  "category"
);
if (initialCategory) {
  applyPaginationAndFilter(initialCategory);
}
