$(document).ready(() => {
  render_projects("featured");
});

let render_projects = (slug) => {
  let projects_area = $(".projects-wrapper");

  $(".white-button").removeClass("white-button-hover");
  $(`#${slug}`).addClass("white-button-hover");

  let projects_obj = [
    {
      image: "assets/images/memorization2.png",
      link: "https://github.com/devRenio/devRenio.github.io/tree/main/samuel",
      title: "Bible-verse-memorization(web)",
      demo: "https://devrenio.github.io/samuel",
      technologies: ["React"],
      description: "React project for the Memorization at Samuel School.",
      categories: ["featured", "react"],
    },
    {
      image: "assets/images/memorization1.png",
      link: "https://github.com/devRenio/Bible-verse-memorization",
      title: "Bible-verse-memorization(app)",
      demo: "https://github.com/devRenio/Bible-verse-memorization/releases/download/42SS/samuel_memorization.exe",
      technologies: ["Python"],
      description: "Python project for the Memorization at Samuel School.",
      categories: ["python"],
    },
  ];

  let projects = [];
  if (slug == "all") {
    projects = projects_obj.map(project_mapper);
  } else {
    projects = projects_obj
      .filter((project) => project.categories.includes(slug))
      .map(project_mapper);
  }
  projects_area
    .hide()
    .html(projects)
    .fadeIn(() => {
      // ✅ ScrollTrigger 초기화
      ScrollTrigger.refresh();

      // ✅ 애니메이션 실행
      gsap.fromTo(
        ".card.shadowDepth1",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.3,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".projects-wrapper",
            start: "top 85%",
            once: true,
          },
        },
      );
    });
};

let project_mapper = (project) => {
  return `
    <div class="wrapper">
      <div class="card radius shadowDepth1">
        ${
          project.image
            ? `<div class="card__image border-tlr-radius">
                <a href="${project.link}">
                    <img src="${project.image}" alt="image" id="project-image" class="border-tlr-radius">
                </a>
            </div>`
            : ""
        }

        <div class="card__content card__padding">
          <article class="card__article">
            <h2><a href="${project.link}">${project.title}</a></h2>
            <p class="paragraph-text-normal">${project.description}</p>
          </article>

          <div class="card__meta">
            ${project.technologies
              .map(
                (tech) =>
                  `<span class="project-technology paragraph-text-normal">${tech}</span>`,
              )
              .join("")}
            
            ${
              project.demo
                ? `<a href="${project.demo}" target="_blank" class="demo-button paragraph-text-normal">Demo</a>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;
};

let selected = (slug) => {
  render_projects(slug);
};
