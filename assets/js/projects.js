$(document).ready(() => {
  render_projects("featured");
});

let render_projects = (slug) => {
  let projects_area = $(".projects-wrapper");

  $(".white-button").removeClass("white-button-hover");
  $(`#${slug}`).addClass("white-button-hover");

  let projects_obj = [
    {
      image: "assets/images/memorization.png",
      link: "https://github.com/devRenio/Bible-verse-memorization",
      title: "Bible-verse-memorization",
      demo: "",
      technologies: ["Python"],
      description: "Python project for the Memorization at Samuel School.",
      categories: ["featured", "python"],
    },
    {
      image: "assets/images/memorization.png",
      link: "https://github.com/devRenio/Bible-verse-memorization",
      title: "Bible-verse-memorization",
      demo: "",
      technologies: ["Python"],
      description: "Python project for the Memorization at Samuel School.",
      categories: ["featured", "python"],
    },
    {
      image: "assets/images/memorization.png",
      link: "https://github.com/devRenio/Bible-verse-memorization",
      title: "Bible-verse-memorization",
      demo: "",
      technologies: ["Python"],
      description: "Python project for the Memorization at Samuel School.",
      categories: ["featured", "python"],
    },
    {
      image: "assets/images/memorization.png",
      link: "https://github.com/devRenio/Bible-verse-memorization",
      title: "Bible-verse-memorization",
      demo: "",
      technologies: ["Python"],
      description: "Python project for the Memorization at Samuel School.",
      categories: ["featured", "python"],
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
        }
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
        
                        <p class="paragraph-text-normal">${
                          project.description
                        } ${
    project.demo ? `<a href="${project.demo}">Demo</a>` : ""
  }</p>
                    </article>

                                
                    <div class="card__meta">
                        ${project.technologies
                          .map(
                            (tech) =>
                              `<span class="project-technology paragraph-text-normal">${tech}</span>`
                          )
                          .join("")}
                    </div>

                </div>
            </div>
        </div>
    `;
};

let selected = (slug) => {
  render_projects(slug);
};
