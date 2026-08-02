/* 스플래시 → 히어로/카드 등장, 커서 하이라이트.
   랜딩은 스크롤 없는 스테이지라 ScrollSmoother를 쓰지 않는다. */
(function () {
  "use strict";

  var R = (window.Renio = window.Renio || {});
  R.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  R.smoother = null;
  R.ease = "power3.inOut";

  var splash = document.querySelector("[data-splash]");
  var stage = document.querySelector(".stage");

  function qsa(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }

  var heroTitle = document.querySelector("[data-hero-title]");
  var heroLines = qsa("[data-hero-line]");
  var cards = qsa("[data-bento] .card");
  var heroAll = (heroTitle ? [heroTitle] : []).concat(heroLines);

  if (!window.gsap) {
    finishBootFallback();
    return;
  }

  var plugins = [window.Flip, window.SplitText].filter(Boolean);
  gsap.registerPlugin.apply(gsap, plugins);

  R.scrollToEl = function () {};
  R.refresh = function () {};

  if (!R.reduced && heroAll.length) gsap.set(heroAll, { opacity: 0 });
  if (!R.reduced && cards.length) gsap.set(cards, { opacity: 0, y: 18 });

  var fontsReady =
    document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

  var minHold = new Promise(function (resolve) {
    setTimeout(resolve, R.reduced ? 200 : 900);
  });

  Promise.all([
    Promise.race([
      fontsReady,
      new Promise(function (resolve) {
        setTimeout(resolve, 1500);
      }),
    ]),
    minHold,
  ]).then(dismissSplash);

  function dismissSplash() {
    document.body.classList.remove("is-booting");

    if (!splash) {
      playPageIntro();
      return;
    }

    if (R.reduced) {
      splash.remove();
      revealInstant();
      bindCardGlow();
      return;
    }

    var mark = splash.querySelector("[data-splash-mark]");
    var tag = splash.querySelector("[data-splash-tag]");
    var bar = splash.querySelector(".splash__bar");

    var tl = gsap.timeline({
      defaults: { ease: R.ease },
      onComplete: function () {
        splash.remove();
        playPageIntro();
      },
    });

    if (bar) tl.to(bar, { scaleX: 0.2, opacity: 0, duration: 0.45 }, 0);
    if (tag) tl.to(tag, { y: -8, opacity: 0, duration: 0.45 }, 0);
    if (mark) tl.to(mark, { y: -14, opacity: 0, duration: 0.55 }, 0.05);
    tl.to(splash, { opacity: 0, duration: 0.55 }, 0.15);
    if (stage) tl.to(stage, { opacity: 1, duration: 0.55 }, 0.2);
  }

  function revealInstant() {
    if (stage) stage.style.opacity = "1";
    if (heroAll.length) gsap.set(heroAll, { clearProps: "opacity,transform" });
    if (cards.length) gsap.set(cards, { clearProps: "opacity,transform" });
  }

  function playPageIntro() {
    if (R.reduced) {
      revealInstant();
      bindCardGlow();
      return;
    }

    if (stage) gsap.set(stage, { opacity: 1 });
    playHeroIntro();
    playCardsIntro();
    bindCardGlow();
  }

  function playHeroIntro() {
    if (!heroAll.length) return;

    var tl = gsap.timeline({ defaults: { ease: R.ease } });

    if (heroTitle) {
      var chars = null;
      if (window.SplitText) {
        try {
          chars = new SplitText(heroTitle, { type: "chars" }).chars;
        } catch (err) {
          chars = null;
        }
      }

      gsap.set(heroTitle, { opacity: 1 });

      if (chars && chars.length) {
        tl.from(chars, {
          yPercent: 45,
          opacity: 0,
          duration: 1.05,
          stagger: 0.028,
          clearProps: "opacity,transform",
        });
      } else {
        tl.fromTo(
          heroTitle,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            clearProps: "opacity,transform",
          }
        );
      }
    }

    if (heroLines.length) {
      tl.fromTo(
        heroLines,
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.08,
          clearProps: "opacity,transform",
        },
        "-=0.55"
      );
    }
  }

  function playCardsIntro() {
    if (!cards.length) return;

    R.cardsIntro = gsap.to(cards, {
      y: 0,
      opacity: 1,
      duration: 0.95,
      stagger: 0.09,
      ease: R.ease,
      clearProps: "opacity,transform",
      delay: 0.08,
    });
  }

  function bindCardGlow() {
    cards.forEach(function (card) {
      var rect = null;
      var queued = false;
      var px = 0;
      var py = 0;

      function paint() {
        queued = false;
        if (!rect) return;
        card.style.setProperty(
          "--mx",
          ((px - rect.left) / rect.width) * 100 + "%"
        );
        card.style.setProperty(
          "--my",
          ((py - rect.top) / rect.height) * 100 + "%"
        );
      }

      card.addEventListener("pointerenter", function () {
        rect = card.getBoundingClientRect();
      });

      card.addEventListener("pointermove", function (e) {
        px = e.clientX;
        py = e.clientY;
        if (!rect) rect = card.getBoundingClientRect();
        if (!queued) {
          queued = true;
          requestAnimationFrame(paint);
        }
      });

      card.addEventListener("pointerleave", function () {
        rect = null;
      });
    });
  }

  function finishBootFallback() {
    document.body.classList.remove("is-booting");
    if (splash) splash.remove();
    if (stage) stage.style.opacity = "1";
  }
})();
