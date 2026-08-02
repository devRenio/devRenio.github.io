/* 랜딩 Blog 카드: JSON 기반 목록·검색·카테고리·페이지네이션·리더 */
(function () {
  "use strict";

  var PAGE_SIZE = 5;
  var card = document.querySelector("[data-blog-card]");
  if (!card) return;

  var listEl = card.querySelector("[data-blog-list]");
  var readerEl = card.querySelector("[data-blog-reader]");
  var mountEl = card.querySelector("[data-blog-mount]");
  var statusEl = card.querySelector("[data-blog-status]");
  var entriesEl = card.querySelector("[data-blog-entries]");
  var paginationEl = card.querySelector("[data-blog-pagination]");
  var titleEl = card.querySelector("[data-blog-title]");
  var emptyEl = card.querySelector("[data-blog-empty]");
  var searchInput = card.querySelector("[data-blog-search]");
  var searchBtn = card.querySelector("[data-blog-search-btn]");
  var backBtn = card.querySelector("[data-blog-back]");
  var prevBtn = card.querySelector("[data-blog-prev]");
  var nextBtn = card.querySelector("[data-blog-next]");
  var jsonUrl = card.getAttribute("data-blog-json");

  if (!listEl || !readerEl || !mountEl || !entriesEl || !jsonUrl) return;

  var posts = null;
  var loadPromise = null;
  var articleCache = Object.create(null);
  var state = {
    category: "",
    query: "",
    page: 1,
    slug: null,
  };
  var hljsPromise = null;
  var mathPromise = null;
  var syncingHash = false;
  var listTween = null;
  var readerTween = null;
  var easeOut = "power3.out";
  var easeIn = "power2.in";

  /* ---------- events ---------- */

  card.addEventListener("click", function (e) {
    var openBtn = e.target.closest("[data-blog-open]");
    if (openBtn) {
      e.preventDefault();
      e.stopPropagation();
      openPost(openBtn.getAttribute("data-blog-open"));
      return;
    }

    var toggle = e.target.closest("[data-blog-cat-toggle]");
    if (toggle) {
      e.preventDefault();
      e.stopPropagation();
      var node = toggle.closest("[data-blog-cat-node]");
      if (node) setNodeOpen(node, !node.classList.contains("is-open"), true);
      return;
    }

    var catBtn = e.target.closest("[data-blog-category]");
    if (catBtn) {
      e.preventDefault();
      e.stopPropagation();
      var key = catBtn.getAttribute("data-blog-category") || "";
      var catNode = catBtn.closest("[data-blog-cat-node]");
      if (catNode && catNode.classList.contains("has-children")) {
        setNodeOpen(catNode, true, true);
      }
      setCategory(key);
      return;
    }

    var pageBtn = e.target.closest("[data-blog-page]");
    if (pageBtn) {
      e.preventDefault();
      e.stopPropagation();
      var raw = pageBtn.getAttribute("data-blog-page");
      if (raw === "prev") goPage(state.page - 1);
      else if (raw === "next") goPage(state.page + 1);
      else goPage(parseInt(raw, 10) || 1);
    }
  });

  if (backBtn) {
    backBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      showList(true);
      ensureData().then(function () {
        renderList(true);
      });
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      stepPost(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      stepPost(1);
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      runSearch();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearch();
      }
    });
    searchInput.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  if (window.Renio && Renio.bento && Renio.bento.onChange) {
    Renio.bento.onChange(function (ev) {
      if (ev.name !== "blog") {
        if (state.slug) resetReaderDom();
        return;
      }
      ensureData().then(function () {
        syncFromHash();
        if (!state.slug) renderList();
      });
    });
  }

  window.addEventListener("hashchange", function () {
    if (syncingHash) return;
    if (!isBlogHash()) return;
    ensureBlogOpen();
    ensureData().then(syncFromHash);
  });

  if (isBlogHash()) {
    ensureBlogOpen();
    ensureData().then(syncFromHash);
  }

  /* ---------- data ---------- */

  function ensureData() {
    if (posts) return Promise.resolve(posts);
    if (loadPromise) return loadPromise;
    setStatus("불러오는 중…");
    loadPromise = fetch(jsonUrl, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        posts = Array.isArray(data) ? data : [];
        posts.forEach(function (p) {
          p._search = normalize(
            [p.title, p.excerpt, (p.categories || []).join(" "), p.search || ""].join(" ")
          );
        });
        setStatus("");
        return posts;
      })
      .catch(function () {
        posts = [];
        setStatus("글을 불러오지 못했습니다.");
        return posts;
      });
    return loadPromise;
  }

  function fetchArticleHtml(post) {
    if (articleCache[post.slug]) {
      return Promise.resolve(articleCache[post.slug]);
    }
    var url = post.url;
    if (!url) return Promise.reject(new Error("missing url"));
    return fetch(url, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var article = doc.querySelector("[data-blog-article]");
        if (!article) throw new Error("article missing");
        var body = article.querySelector(".blog-article__body");
        var bodyHtml = body ? body.innerHTML : "";
        articleCache[post.slug] = bodyHtml;
        return bodyHtml;
      });
  }

  /* ---------- hash / navigation ---------- */

  function isBlogHash() {
    var h = location.hash.slice(1);
    return h === "blog" || h.indexOf("blog/") === 0;
  }

  function ensureBlogOpen() {
    if (!window.Renio || !Renio.bento) return;
    var cur = Renio.bento.current();
    if (!cur || cur.getAttribute("data-card") !== "blog") {
      Renio.bento.open(card);
    }
  }

  function syncFromHash() {
    var parsed = parseHash();
    state.category = parsed.category || "";
    state.query = parsed.query || "";
    state.slug = parsed.slug || null;
    if (searchInput && parsed.query) searchInput.value = parsed.query;
    markActiveCategory(state.category);
    expandCategoryPath(state.category);

    if (state.slug) {
      openPost(state.slug, false);
    } else {
      showList(false);
      state.page = 1;
      renderList();
    }
  }

  function parseHash() {
    var h = location.hash.slice(1);
    var out = { slug: null, category: "", query: "" };
    if (!h || h === "blog") return out;
    if (h.indexOf("blog/posts/") === 0) {
      out.slug = decodeURIComponent(h.slice("blog/posts/".length));
      return out;
    }
    if (h.indexOf("blog/category/") === 0) {
      out.category = decodeURIComponent(h.slice("blog/category/".length));
      return out;
    }
    if (h.indexOf("blog/q/") === 0) {
      out.query = decodeURIComponent(h.slice("blog/q/".length));
      return out;
    }
    return out;
  }

  function writeHash(hash) {
    if (!window.history || !history.replaceState) return;
    if (location.hash === hash) return;
    syncingHash = true;
    history.replaceState(null, "", hash);
    setTimeout(function () {
      syncingHash = false;
    }, 0);
  }

  function hashForList() {
    if (state.query) return "#blog/q/" + encodeURIComponent(state.query);
    if (state.category) {
      return "#blog/category/" + encodeURIComponent(state.category);
    }
    return "#blog";
  }

  /* ---------- list ---------- */

  function setCategory(key) {
    ensureBlogOpen();
    state.category = key || "";
    state.query = "";
    state.page = 1;
    state.slug = null;
    if (searchInput) searchInput.value = "";
    markActiveCategory(state.category);
    writeHash(hashForList());
    ensureData().then(function () {
      showList(false);
      renderList();
    });
  }

  function runSearch() {
    ensureBlogOpen();
    state.query = searchInput ? searchInput.value.trim() : "";
    state.category = "";
    state.page = 1;
    state.slug = null;
    markActiveCategory("");
    writeHash(hashForList());
    ensureData().then(function () {
      showList(false);
      renderList();
    });
  }

  function goPage(page) {
    state.page = page;
    renderList(true);
    var detail = card.querySelector(".card__detail");
    if (detail) detail.scrollTop = 0;
  }

  function filteredPosts() {
    if (!posts) return [];
    var q = normalize(state.query);
    return posts.filter(function (p) {
      if (state.category) {
        var cats = p.categories || [];
        if (cats.indexOf(state.category) === -1) return false;
      }
      if (q && p._search.indexOf(q) === -1) return false;
      return true;
    });
  }

  function renderList(animate) {
    var filtered = filteredPosts();
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    state.page = Math.min(Math.max(1, state.page), totalPages);
    var start = (state.page - 1) * PAGE_SIZE;
    var pageItems = filtered.slice(start, start + PAGE_SIZE);
    var shouldAnimate = animate !== false;

    function paint() {
      if (titleEl) {
        if (state.query) titleEl.textContent = "검색 결과 · " + filtered.length;
        else if (state.category) {
          titleEl.textContent = "카테고리 · " + state.category;
        } else titleEl.textContent = "최근 포스트 · " + filtered.length;
      }

      if (emptyEl) emptyEl.hidden = filtered.length > 0;

      entriesEl.innerHTML = pageItems
        .map(function (p) {
          var cat = (p.categories && p.categories[0]) || "";
          return (
            '<button type="button" class="post" data-blog-open="' +
            escapeAttr(p.slug) +
            '">' +
            '<time class="post__date" datetime="' +
            escapeAttr(p.date) +
            '">' +
            escapeHtml(p.dateLabel || p.dateShort) +
            "</time>" +
            '<span class="post__title">' +
            escapeHtml(p.title) +
            "</span>" +
            '<span class="post__cat">' +
            escapeHtml(cat) +
            "</span>" +
            '<span class="post__excerpt">' +
            escapeHtml(p.excerpt || "") +
            "</span>" +
            "</button>"
          );
        })
        .join("");

      renderPagination(totalPages);
      if (shouldAnimate) {
        playListEnter();
      }
    }

    if (shouldAnimate && canAnimate() && entriesEl.children.length) {
      killTween(listTween);
      listTween = gsap.to(entriesEl.children, {
        opacity: 0,
        y: -10,
        duration: 0.18,
        stagger: 0.02,
        ease: easeIn,
        onComplete: paint,
      });
      if (paginationEl && paginationEl.children.length) {
        gsap.to(paginationEl.children, {
          opacity: 0,
          duration: 0.15,
          ease: easeIn,
        });
      }
    } else {
      paint();
    }
  }

  function playListEnter() {
    if (!canAnimate()) return;
    killTween(listTween);
    var postsEls = entriesEl.querySelectorAll(".post");
    var pageEls = paginationEl
      ? paginationEl.querySelectorAll(".blog-pagination__btn, .blog-pagination__ellipsis")
      : [];

    if (titleEl) {
      gsap.fromTo(
        titleEl,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: easeOut, clearProps: "opacity,transform" }
      );
    }
    if (emptyEl && !emptyEl.hidden) {
      gsap.fromTo(
        emptyEl,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: easeOut, clearProps: "opacity,transform" }
      );
    }
    if (postsEls.length) {
      listTween = gsap.fromTo(
        postsEls,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.48,
          stagger: 0.06,
          ease: easeOut,
          clearProps: "opacity,transform",
        }
      );
    }
    if (pageEls.length) {
      gsap.fromTo(
        pageEls,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.03,
          delay: 0.12,
          ease: easeOut,
          clearProps: "opacity,transform",
        }
      );
    }
  }

  function renderPagination(totalPages) {
    if (!paginationEl) return;
    if (totalPages <= 1) {
      paginationEl.innerHTML = "";
      return;
    }

    var html = "";
    html += pageLink("◀", "prev", state.page <= 1);
    var windowSize = 2;
    var start = Math.max(1, state.page - windowSize);
    var end = Math.min(totalPages, state.page + windowSize);

    if (start > 1) {
      html += pageLink("1", "1", false, state.page === 1);
      if (start > 2) html += '<span class="blog-pagination__ellipsis">…</span>';
    }

    for (var i = start; i <= end; i++) {
      html += pageLink(String(i), String(i), false, i === state.page);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        html += '<span class="blog-pagination__ellipsis">…</span>';
      }
      html += pageLink(
        String(totalPages),
        String(totalPages),
        false,
        state.page === totalPages
      );
    }

    html += pageLink("▶", "next", state.page >= totalPages);
    paginationEl.innerHTML = html;
  }

  function pageLink(label, page, disabled, current) {
    return (
      '<button type="button" class="blog-pagination__btn' +
      (current ? " is-current" : "") +
      '"' +
      (disabled ? " disabled" : "") +
      ' data-blog-page="' +
      page +
      '">' +
      label +
      "</button>"
    );
  }

  /* ---------- reader ---------- */

  function openPost(slug, updateHash) {
    if (!slug) return;
    ensureBlogOpen();
    if (updateHash !== false) writeHash("#blog/posts/" + encodeURIComponent(slug));
    ensureData().then(function () {
      var post = findBySlug(slug);
      if (!post) {
        showReader(true);
        mountEl.innerHTML = "";
        setStatus("글을 찾을 수 없습니다.");
        return;
      }
      state.slug = post.slug;
      showReader(readerEl.hidden);
      setStatus("불러오는 중…");
      if (!articleCache[post.slug]) mountEl.innerHTML = "";

      fetchArticleHtml(post)
        .then(function (bodyHtml) {
          if (state.slug !== post.slug) return;

          function paintReader() {
            setStatus("");
            mountEl.innerHTML =
              '<article class="blog-article">' +
              '<header class="blog-article__head">' +
              '<h1 class="blog-article__title">' +
              escapeHtml(post.title) +
              "</h1>" +
              '<div class="blog-article__meta">' +
              '<time class="blog-article__date" datetime="' +
              escapeAttr(post.date) +
              '">' +
              escapeHtml(formatDateKo(post.date, post.dateLabel)) +
              "</time>" +
              renderCatLinks(post.categories) +
              "</div></header>" +
              '<div class="blog-article__body">' +
              bodyHtml +
              "</div></article>";

            var detail = card.querySelector(".card__detail");
            if (detail) detail.scrollTop = 0;
            updateStepButtons(post);
            enhance(mountEl, post.useMath);
            playReaderEnter();
          }

          if (canAnimate() && mountEl.children.length) {
            killTween(readerTween);
            readerTween = gsap.to(mountEl, {
              opacity: 0,
              y: -10,
              duration: 0.18,
              ease: easeIn,
              onComplete: function () {
                gsap.set(mountEl, { clearProps: "opacity,transform" });
                paintReader();
              },
            });
          } else {
            paintReader();
          }
        })
        .catch(function () {
          if (state.slug !== post.slug) return;
          mountEl.innerHTML = "";
          setStatus("글을 불러오지 못했습니다. 전체 페이지에서 열어주세요.");
          var full =
            '<p class="blog-reader__fallback"><a href="' +
            escapeAttr(post.url) +
            '">원문 페이지로 이동</a></p>';
          mountEl.innerHTML = full;
        });
    });
  }

  function playReaderEnter() {
    if (!canAnimate()) return;
    killTween(readerTween);
    var toolbar = readerEl.querySelector(".blog-reader__toolbar");
    var article = mountEl.querySelector(".blog-article");
    if (toolbar) {
      gsap.fromTo(
        toolbar,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.35, ease: easeOut, clearProps: "opacity,transform" }
      );
    }
    if (article) {
      readerTween = gsap.fromTo(
        article,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.5, ease: easeOut, clearProps: "opacity,transform" }
      );
    }
  }

  function showList(updateHash) {
    state.slug = null;
    readerEl.hidden = true;
    listEl.hidden = false;
    resetReaderDom();
    if (updateHash) writeHash(hashForList());
    if (canAnimate()) {
      gsap.fromTo(
        listEl,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: easeOut, clearProps: "opacity,transform" }
      );
    }
  }

  function showReader(animateShell) {
    listEl.hidden = true;
    readerEl.hidden = false;
    if (animateShell !== false && canAnimate()) {
      gsap.fromTo(
        readerEl,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: easeOut, clearProps: "opacity,transform" }
      );
    }
  }

  function resetReaderDom() {
    mountEl.innerHTML = "";
    setStatus("");
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
  }

  function stepPost(delta) {
    if (!posts || !state.slug) return;
    var i = posts.findIndex(function (p) {
      return p.slug === state.slug;
    });
    if (i < 0) return;
    var next = posts[i + delta];
    if (next) openPost(next.slug);
  }

  function updateStepButtons(post) {
    if (!posts) return;
    var i = posts.findIndex(function (p) {
      return p.slug === post.slug;
    });
    if (prevBtn) prevBtn.disabled = i <= 0;
    if (nextBtn) nextBtn.disabled = i < 0 || i >= posts.length - 1;
  }

  function findBySlug(slug) {
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].slug === slug) return posts[i];
    }
    return null;
  }

  function renderCatLinks(categories) {
    if (!categories || !categories.length) return "";
    var html = '<div class="blog-article__cats">';
    categories.forEach(function (c) {
      html +=
        '<button type="button" class="blog-article__cat" data-blog-category="' +
        escapeAttr(c) +
        '">' +
        escapeHtml(c) +
        "</button>";
    });
    return html + "</div>";
  }

  function formatDateKo(iso, fallback) {
    if (fallback && /년/.test(fallback)) return fallback;
    var d = iso ? new Date(iso) : null;
    if (!d || isNaN(d.getTime())) return fallback || "";
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    var h = String(d.getHours()).padStart(2, "0");
    return y + "년 " + m + "월 " + day + "일 " + h + "시";
  }

  /* ---------- category UI ---------- */

  function markActiveCategory(key) {
    card.querySelectorAll("[data-blog-category]").forEach(function (el) {
      var val = el.getAttribute("data-blog-category") || "";
      el.classList.toggle("is-active", val === (key || ""));
    });
  }

  function setNodeOpen(node, open, accordion) {
    if (!node || !node.classList.contains("has-children")) return;
    var willOpen = !!open;

    if (willOpen && accordion) {
      var parent = node.parentElement;
      if (parent) {
        Array.prototype.forEach.call(parent.children, function (sib) {
          if (sib !== node && sib.classList.contains("is-open")) {
            setNodeOpen(sib, false, false);
          }
        });
      }
    }

    node.classList.toggle("is-open", willOpen);
    var chevron = null;
    var row = null;
    for (var i = 0; i < node.children.length; i++) {
      if (node.children[i].classList.contains("blog-cat__row")) {
        row = node.children[i];
        break;
      }
    }
    if (row) chevron = row.querySelector("[data-blog-cat-toggle]");
    if (chevron) chevron.setAttribute("aria-expanded", willOpen ? "true" : "false");

    if (willOpen) staggerCatChildren(node);
  }

  function staggerCatChildren(node) {
    if (!canAnimate()) return;
    var panel = null;
    for (var i = 0; i < node.children.length; i++) {
      if (node.children[i].hasAttribute("data-blog-cat-panel")) {
        panel = node.children[i];
        break;
      }
    }
    if (!panel) return;
    var list = panel.querySelector(".blog-cat");
    if (!list) return;
    var rows = [];
    Array.prototype.forEach.call(list.children, function (li) {
      var row = li.querySelector(".blog-cat__row");
      if (row) rows.push(row);
    });
    if (!rows.length) return;
    gsap.fromTo(
      rows,
      { opacity: 0, x: -12, y: 6 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.42,
        stagger: 0.05,
        ease: easeOut,
        clearProps: "opacity,transform",
      }
    );
  }

  function expandCategoryPath(key) {
    if (!key) return;
    var active = card.querySelector(
      '[data-blog-category="' + cssEscape(key) + '"]'
    );
    if (!active) return;
    var node = active.closest("[data-blog-cat-node]");
    while (node) {
      if (node.classList.contains("has-children")) {
        setNodeOpen(node, true, false);
      }
      var parentNode = node.parentElement
        ? node.parentElement.closest("[data-blog-cat-node]")
        : null;
      node = parentNode;
    }
  }

  function canAnimate() {
    return !!(window.gsap && !(window.Renio && Renio.reduced));
  }

  function killTween(tw) {
    if (tw && tw.kill) tw.kill();
  }

  /* ---------- enhance ---------- */

  function enhance(root, useMath) {
    highlightCode(root);
    if (useMath) loadMathJax().then(function () {
      if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([root]).catch(function () {});
      }
    });
  }

  function highlightCode(root) {
    var blocks = root.querySelectorAll("pre code");
    if (!blocks.length) return;
    loadHljs().then(function (hljs) {
      if (!hljs) return;
      Array.prototype.forEach.call(blocks, function (block) {
        hljs.highlightElement(block);
      });
    });
  }

  function loadHljs() {
    if (window.hljs) return Promise.resolve(window.hljs);
    if (hljsPromise) return hljsPromise;
    hljsPromise = new Promise(function (resolve) {
      ensureStylesheet(
        "renio-hljs-css",
        "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css"
      );
      var script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js";
      script.onload = function () {
        resolve(window.hljs || null);
      };
      script.onerror = function () {
        resolve(null);
      };
      document.head.appendChild(script);
    });
    return hljsPromise;
  }

  function loadMathJax() {
    if (window.MathJax && MathJax.typesetPromise) {
      return Promise.resolve(window.MathJax);
    }
    if (mathPromise) return mathPromise;
    window.MathJax = {
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
      },
    };
    mathPromise = new Promise(function (resolve) {
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      script.onload = function () {
        resolve(window.MathJax || null);
      };
      script.onerror = function () {
        resolve(null);
      };
      document.head.appendChild(script);
    });
    return mathPromise;
  }

  function ensureStylesheet(id, href) {
    if (document.getElementById(id)) return;
    var link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  /* ---------- utils ---------- */

  function setStatus(msg) {
    if (!statusEl) return;
    if (!msg) {
      statusEl.hidden = true;
      statusEl.textContent = "";
      return;
    }
    statusEl.hidden = false;
    statusEl.textContent = msg;
  }

  function normalize(text) {
    return (text || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
  }

  function stripHtml(html) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return tmp.textContent || tmp.innerText || "";
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function cssEscape(str) {
    if (window.CSS && CSS.escape) return CSS.escape(str);
    return String(str).replace(/["\\]/g, "\\$&");
  }
})();
