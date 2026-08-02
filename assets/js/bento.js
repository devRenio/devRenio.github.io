/* 벤토 카드 확장 엔진.
   1) 모든 카드 본문 페이드 아웃
   2) Flip으로 레이아웃 전환
   3) 새 본문 페이드 인 */
(function () {
  "use strict";

  var R = window.Renio || {};
  var ease = R.ease || "power3.inOut";
  var bento = document.querySelector("[data-bento]");
  if (!bento) return;

  var cards = Array.prototype.slice.call(bento.querySelectorAll(".card"));
  if (!cards.length) return;

  var current = null;
  var animating = false;
  var lastFocus = null;

  var canFlip = !!(window.gsap && window.Flip);
  var canTween = !!window.gsap;

  cards.forEach(function (card) {
    var detail = detailOf(card);
    if (detail) detail.setAttribute("tabindex", "-1");

    card.addEventListener("click", function (e) {
      if (e.target.closest("a, button")) return;
      open(card);
    });

    var toggle = card.querySelector("[data-card-toggle]");
    if (toggle) {
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        open(card);
      });
    }

    var closeBtn = card.querySelector("[data-card-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        close();
      });
    }
  });

  /* ---------- 열기 / 닫기 ---------- */

  function open(card) {
    apply(card, false);
  }

  function close() {
    apply(null, false);
  }

  function apply(next, instant) {
    if (animating || next === current) return;

    if (R.cardsIntro) {
      R.cardsIntro.progress(1).kill();
      R.cardsIntro = null;
      if (canTween) gsap.set(cards, { clearProps: "opacity,transform" });
    }

    var previous = current;
    if (next && !previous) lastFocus = document.activeElement;

    var animate = canFlip && canTween && !R.reduced && !instant;
    animating = true;

    if (!animate) {
      mutate(next);
      hardSyncVisibility(next);
      current = next;
      syncHash(next);
      settle(next, previous, true);
      animating = false;
      return;
    }

    // 페이드 아웃과 Flip을 같은 타이밍·이징으로 겹친다.
    // detail은 Flip이 끝난 뒤에만 열어, preview와 반반으로 갈라지지 않게 한다.
    var moveDuration = 0.95;
    var outgoing = visibleContents();

    outgoing.forEach(function (el) {
      if (el.classList.contains("card__detail")) {
        el.classList.add("is-fading-out");
      }
    });

    var state = Flip.getState(cards);

    bento.classList.add("is-transitioning");
    mutate(next);
    current = next;
    syncHash(next);

    // 닫을 때는 preview가 다시 보이므로 미리 투명하게 둔다.
    if (!next) gsap.set(allPreviews(), { opacity: 0 });

    var fadeDone = !outgoing.length;
    var flipDone = false;

    function afterMove() {
      if (!fadeDone || !flipDone) return;
      bento.classList.remove("is-transitioning");
      hardSyncVisibility(next);
      settle(next, previous, false);
    }

    if (outgoing.length) {
      gsap.to(outgoing, {
        opacity: 0,
        duration: moveDuration,
        ease: ease,
        onComplete: function () {
          fadeDone = true;
          afterMove();
        },
      });
    }

    Flip.from(state, {
      duration: moveDuration,
      ease: ease,
      absolute: true,
      nested: true,
      onComplete: function () {
        flipDone = true;
        afterMove();
      },
    });
  }

  function mutate(next) {
    cards.forEach(function (card) {
      if (card === next) expandDom(card);
      else collapseDom(card);
      card.classList.toggle("is-dimmed", !!next && card !== next);
    });
    setFocusAttr(next);
  }

  /* 전환이 끝난 뒤에만 선택된 카드의 detail을 연다. */
  function hardSyncVisibility(next) {
    cards.forEach(function (card) {
      var detail = detailOf(card);
      if (!detail) return;
      detail.classList.remove("is-fading-out");
      if (card === next) {
        detail.hidden = false;
      } else {
        detail.hidden = true;
        detail.style.opacity = "";
      }
    });
  }

  function settle(next, previous, instant) {
    if (instant || R.reduced || !canTween) {
      clearContentOpacity();
      focusAfter(next, previous);
      animating = false;
      return;
    }

    if (next) {
      var detail = detailOf(next);
      if (!detail) {
        animating = false;
        return;
      }

      var items = detail.querySelectorAll("[data-stagger]");
      gsap.set(detail, { opacity: 0 });
      if (items.length) gsap.set(items, { opacity: 0, y: 12 });

      var tl = gsap.timeline({
        onComplete: function () {
          clearContentOpacity();
          focusAfter(next, previous);
          animating = false;
        },
      });

      tl.to(detail, {
        opacity: 1,
        duration: 0.5,
        ease: ease,
      });

      if (items.length) {
        tl.to(
          items,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.07,
            ease: ease,
          },
          "-=0.28"
        );
      }
    } else {
      var previews = allPreviews();
      gsap.set(previews, { opacity: 0 });
      gsap.to(previews, {
        opacity: 1,
        duration: 0.55,
        stagger: 0.07,
        ease: ease,
        onComplete: function () {
          clearContentOpacity();
          focusAfter(next, previous);
          animating = false;
        },
      });
    }
  }

  function focusAfter(next, previous) {
    if (next) {
      var detail = detailOf(next);
      if (detail) detail.focus({ preventScroll: true });
    } else if (previous) {
      var toggle = previous.querySelector("[data-card-toggle]");
      if (toggle) toggle.focus({ preventScroll: true });
      else if (lastFocus && lastFocus.focus) lastFocus.focus();
      lastFocus = null;
    }
  }

  function setFocusAttr(card) {
    if (card) bento.setAttribute("data-focus", card.getAttribute("data-card"));
    else bento.removeAttribute("data-focus");
  }

  function expandDom(card) {
    card.classList.add("is-expanded");
    // detail은 settle 단계에서 연다. 여기서 열면 preview와 flex 공간을 나눠 먹는다.
    setExpanded(card, true);
  }

  function collapseDom(card) {
    card.classList.remove("is-expanded");
    var detail = detailOf(card);
    if (detail && !detail.classList.contains("is-fading-out")) {
      detail.hidden = true;
    }
    setExpanded(card, false);
  }

  /* ---------- content helpers ---------- */

  function detailOf(card) {
    return card.querySelector(".card__detail");
  }

  function previewOf(card) {
    return card.querySelector(".card__preview");
  }

  function allPreviews() {
    return cards.map(previewOf).filter(Boolean);
  }

  function visibleContents() {
    var els = [];
    cards.forEach(function (card) {
      var preview = previewOf(card);
      var detail = detailOf(card);
      if (preview && isPainted(preview)) els.push(preview);
      if (detail && isPainted(detail)) els.push(detail);
    });
    return els;
  }

  function isPainted(el) {
    if (!el || el.hidden) return false;
    var style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return parseFloat(style.opacity || "1") > 0.01;
  }

  function fadeContents(els, to, duration) {
    if (!els.length) return Promise.resolve();
    if (!canTween || R.reduced) {
      els.forEach(function (el) {
        el.style.opacity = String(to);
      });
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      gsap.to(els, {
        opacity: to,
        duration: duration,
        ease: ease,
        onComplete: resolve,
      });
    });
  }

  function clearContentOpacity() {
    cards.forEach(function (card) {
      card.querySelectorAll("[data-card-content]").forEach(function (el) {
        el.style.opacity = "";
      });
      card.querySelectorAll("[data-stagger]").forEach(function (el) {
        el.style.opacity = "";
        el.style.transform = "";
      });
    });
  }

  function setExpanded(card, value) {
    var toggle = card.querySelector("[data-card-toggle]");
    if (toggle) toggle.setAttribute("aria-expanded", value ? "true" : "false");
  }

  /* ---------- 해시 연동 ---------- */

  function cardByName(name) {
    if (!name) return null;
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute("data-card") === name) return cards[i];
    }
    return null;
  }

  function syncHash(card) {
    if (!window.history || !history.replaceState) return;
    var url = card
      ? "#" + card.getAttribute("data-card")
      : location.pathname + location.search;
    history.replaceState(null, "", url);
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (link) {
      var target = cardByName(link.getAttribute("href").slice(1));
      if (target) {
        e.preventDefault();
        open(target);
        return;
      }
    }

    if (!current) return;
    if (e.target.closest(".card") || e.target.closest(".hero__socials")) return;
    close();
  });

  window.addEventListener("hashchange", function () {
    var card = cardByName(location.hash.slice(1));
    if (card) open(card);
  });

  var initial = cardByName(location.hash.slice(1));
  if (initial) apply(initial, true);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && current) {
      e.preventDefault();
      close();
    }
  });

  /* ---------- 프로젝트 필터 ---------- */

  var filterBar = document.querySelector("[data-project-filter]");
  var projectList = document.querySelector("[data-project-list]");

  if (filterBar && projectList) {
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      e.stopPropagation();

      Array.prototype.forEach.call(
        filterBar.querySelectorAll(".filter-btn"),
        function (b) {
          b.classList.toggle("is-active", b === btn);
        }
      );

      var tag = btn.getAttribute("data-filter");
      var items = projectList.querySelectorAll(".project");
      var state = canFlip && !R.reduced ? Flip.getState(items) : null;

      Array.prototype.forEach.call(items, function (item) {
        var tags = (item.getAttribute("data-tags") || "").split(",");
        item.hidden = tag !== "all" && tags.indexOf(tag) === -1;
      });

      if (state) {
        Flip.from(state, {
          duration: 0.7,
          ease: ease,
          absolute: true,
          onEnter: function (els) {
            gsap.fromTo(
              els,
              { opacity: 0, scale: 0.96 },
              { opacity: 1, scale: 1, duration: 0.55, ease: ease }
            );
          },
          onLeave: function (els) {
            gsap.to(els, {
              opacity: 0,
              scale: 0.96,
              duration: 0.45,
              ease: ease,
            });
          },
        });
      }
    });
  }

  /* ---------- 이메일 복사 ---------- */

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy]");
    if (!btn) return;
    e.stopPropagation();

    var text = btn.getAttribute("data-copy");
    var label = btn.querySelector("[data-copy-label]");

    copyText(text).then(function (ok) {
      if (!ok) return;
      btn.classList.add("is-done");
      if (label) label.textContent = "Copied";
      setTimeout(function () {
        btn.classList.remove("is-done");
        if (label) label.textContent = "Copy";
      }, 1800);
    });
  });

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return legacyCopy(text);
        }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }
})();
