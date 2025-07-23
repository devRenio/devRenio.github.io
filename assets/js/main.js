document.addEventListener("DOMContentLoaded", function () {
  blog_posts();

  // Fade-in 애니메이션 처리
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  });

  document.querySelectorAll(".category-toggle-wrapper").forEach((wrapper) => {
    wrapper.addEventListener("click", function (e) {
      if (e.target.tagName.toLowerCase() === "a") return; // 링크 클릭은 무시
      const targetId = wrapper.getAttribute("data-target");
      const target = document.getElementById(targetId);
      if (target) {
        target.style.display =
          target.style.display === "none" || target.style.display === ""
            ? "block"
            : "none";
      }
    });
  });

  const selected = new URLSearchParams(window.location.search).get("category");
  document.querySelectorAll(".category-list > li > a").forEach((link) => {
    if (link.href.includes(`category=${selected}`)) {
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
});

document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const selected = params.get("category");
  const titleEl = document.getElementById("category-title");
  if (selected && titleEl) {
    titleEl.innerHTML = `<b>카테고리 - ${selected}</b>`;
  }
});

function blog_posts() {
  let post_html = [];

  for (let post of featuredPosts) {
    let post_template = `
      <div class="blog-post" onclick="blog_link_click('${post.url}');">
        <div class="blog-link">
          <h3><a href="${post.url}">${post.title}</a></h3>            
        </div>
        <div class="blog-goto-link">
          <img class="blog-arrow" src="/assets/images/right-open-mini.svg"/>
        </div>
      </div>
    `;
    post_html.push(post_template);
  }

  let more_template = `
    <div class="blog-post more-blogs" onclick="blog_link_click('/blog');">
      <div class="blog-link">
        <h3><a href="/blog">Visit the blog for more posts</a></h3>            
      </div>
      <div class="blog-goto-link">
        <img class="blog-arrow" src="/assets/images/right-open-mini.svg"/>
      </div>
    </div>
  `;
  post_html.push(more_template);

  const rssFeeds = document.getElementById("rss-feeds");
  if (rssFeeds) {
    rssFeeds.innerHTML = post_html.join("");
  }

  document.querySelectorAll(".skillbar").forEach((bar) => {
    const percent = bar.getAttribute("data-percent");
    const innerBar = bar.querySelector(".skillbar-bar");
    if (innerBar) {
      innerBar.style.width = "0%";
      setTimeout(() => {
        innerBar.style.transition = "width 1s";
        innerBar.style.width = percent;
      }, 10);
    }
  });
}

function blog_link_click(url) {
  window.location = url;
}

$(document).ready(function () {
  $(".category-toggle").click(function () {
    $(this).nextAll(".subcategory-list").first().slideToggle(200);
    $(this).text($(this).text() === "▼" ? "▲" : "▼");
  });

  const params = new URLSearchParams(window.location.search);
  const selected = params.get("category");

  if (selected) {
    $(".blog-entry").each(function () {
      const categories = $(this).data("categories");
      const categoryArray = categories ? categories.split(",") : [];
      if (!categoryArray.includes(selected)) {
        $(this).hide();
      }
    });
  }
});

const pageSize = 5;
let currentPage = 1;

function applyPaginationAndFilter(category) {
  const posts = Array.from(document.querySelectorAll(".blog-entry"));
  const postList = document.querySelector(".blog-posts ul");
  const paginationContainer = document.querySelector(".pagination");

  const filteredPosts = category
    ? posts.filter((post) => {
        const categories = post.dataset.categories.split(",");
        return categories.includes(category);
      })
    : posts;

  const totalPages = Math.ceil(filteredPosts.length / pageSize);
  posts.forEach((p) => (p.style.display = "none"));
  filteredPosts
    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
    .forEach((p) => (p.style.display = "block"));

  if (paginationContainer) paginationContainer.innerHTML = "";
  if (totalPages <= 1) return;

  const createPageBtn = (label, page = null, isCurrent = false) => {
    const el = document.createElement("a");
    el.href = "#";
    el.textContent = label;
    el.className = isCurrent ? "page-number current" : "page-number";
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (page !== null) {
        currentPage = page;
        applyPaginationAndFilter(category);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    return el;
  };

  const createEllipsis = () => {
    const span = document.createElement("span");
    span.className = "page-ellipsis";
    span.textContent = "...";
    return span;
  };

  // ◀ Prev
  const prevBtn = document.createElement("a");
  prevBtn.href = "#";
  prevBtn.innerText = "◀";
  prevBtn.className = "prev-next-button";
  prevBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      applyPaginationAndFilter(category);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  paginationContainer.appendChild(prevBtn);

  const windowSize = 2;
  let start = Math.max(1, currentPage - windowSize);
  let end = Math.min(totalPages, currentPage + windowSize);

  // 첫 페이지
  if (start > 1) {
    paginationContainer.appendChild(createPageBtn("1", 1));
    if (start > 2) paginationContainer.appendChild(createEllipsis());
  }

  // 중앙 번호들
  for (let i = start; i <= end; i++) {
    paginationContainer.appendChild(createPageBtn(i, i, i === currentPage));
  }

  // 마지막 페이지
  if (end < totalPages) {
    if (end < totalPages - 1) paginationContainer.appendChild(createEllipsis());
    paginationContainer.appendChild(createPageBtn(totalPages, totalPages));
  }

  // ▶ Next
  const nextBtn = document.createElement("a");
  nextBtn.href = "#";
  nextBtn.innerText = "▶";
  nextBtn.className = "prev-next-button";
  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      applyPaginationAndFilter(category);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  paginationContainer.appendChild(nextBtn);
}

// URL 파라미터에서 category 가져오기
const urlParams = new URLSearchParams(window.location.search);
const initialCategory = urlParams.get("category");
applyPaginationAndFilter(initialCategory || null);
