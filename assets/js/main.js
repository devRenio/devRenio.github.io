$(document).ready(function () {
  blog_posts();
  general_utils();
});

$(document).ready(function () {
  blog_posts();
  general_utils();

  $(".skillbar").each(function () {
    const percent = $(this).attr("data-percent");
    $(this).find(".skillbar-bar").animate({ width: percent }, 1000);
  });
});

function blog_posts() {
  // keeping it static, can be fetched from a blog dynamically as well
  let posts = [
    {
      url: "_posts/25.07.16.html",
      title: "First post",
    },
  ];

  let post_html = [];

  for (let post of posts) {
    let tags;

    if (post.tags) {
      tags = post.tags.map((tag) => {
        return `<a href="https://www.nagekar.com/tags#${tag}">${tag}</a>`;
      });
    }

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

  // for the more posts link
  let post_template = `
    <div class="blog-post more-blogs" onclick="blog_link_click('https://www.nagekar.com');">

        <div class="blog-link">

            <h3><a href="">Visit the blog for more posts</a></h3>            

        </div>

        <div class="blog-goto-link">
            <img class="blog-arrow" src="/assets/images/right-open-mini.svg"/>
        </div>
    </div>
    `;

  post_html.push(post_template);

  $("#rss-feeds").html(post_html.join(""));
}

function blog_link_click(url) {
  window.location = url;
}
