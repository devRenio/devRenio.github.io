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

  // 카테고리 토글 애니메이션
  document.querySelectorAll(".category-toggle").forEach((button) => {
    const list = button.nextElementSibling;
    list.style.overflow = "hidden";
    list.style.height = "0px";
    list.style.transition = "height 0.3s ease";

    let isOpen = false;

    button.addEventListener("click", () => {
      if (isOpen) {
        list.style.height = list.scrollHeight + "px";
        requestAnimationFrame(() => {
          list.style.height = "0px";
          list.classList.remove("open");
        });
      } else {
        list.style.height = list.scrollHeight + "px";

        list.addEventListener("transitionend", function handler() {
          list.style.height = "auto";
          list.removeEventListener("transitionend", handler);
        });

        list.classList.add("open");
      }

      isOpen = !isOpen;
    });
  });
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
