$(document).ready(function () {
  blog_posts();
  general_utils();
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

  // '더 보기' 링크 추가
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

  $("#rss-feeds").html(post_html.join(""));

  $(".skillbar").each(function () {
    const percent = $(this).attr("data-percent");
    $(this).find(".skillbar-bar").css("width", "0%");
    $(this).find(".skillbar-bar").animate({ width: percent }, 1000);
  });
}

function blog_link_click(url) {
  window.location = url;
}

document.addEventListener("DOMContentLoaded", function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // 한 번만 실행
      }
    });
  });

  document.querySelectorAll(".fade-section").forEach((section) => {
    observer.observe(section);
  });
});

document.querySelectorAll(".category-toggle").forEach((button) => {
  const list = button.nextElementSibling;

  // 초기 스타일 설정
  list.style.overflow = "hidden";
  list.style.height = "0px";
  list.style.transition = "height 0.3s ease";

  let isOpen = false;

  button.addEventListener("click", () => {
    if (isOpen) {
      // 접는 동작
      list.style.height = list.scrollHeight + "px"; // 트랜지션을 위해 높이 고정
      requestAnimationFrame(() => {
        list.style.height = "0px"; // 줄이기 시작
        list.classList.remove("open"); // 클래스 제거 (여백 없어짐)
      });
    } else {
      // 펼치는 동작
      list.style.height = list.scrollHeight + "px"; // 펼치기

      list.addEventListener("transitionend", function handler() {
        list.style.height = "auto"; // 높이를 자동으로
        list.removeEventListener("transitionend", handler);
      });

      list.classList.add("open"); // 클래스 추가 (여백 적용)
    }

    isOpen = !isOpen;
  });
});
