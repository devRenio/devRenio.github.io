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
