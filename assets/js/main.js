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
