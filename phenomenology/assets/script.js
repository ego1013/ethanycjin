/**
 * 现象学100讲 · 公共脚本
 * Phenomenology: Shared Scripts
 */

(function () {
  'use strict';

  /* ============================================================
     localStorage keys
     ============================================================ */
  const KEYS = {
    READ_MARKS: 'phenomenology_read',
    THEME: 'phenomenology_theme',
    FONT_SIZE: 'phenomenology_font_size',
  };

  /* ============================================================
     Utility
     ============================================================ */
  function getReadMarks() {
    try {
      const raw = localStorage.getItem(KEYS.READ_MARKS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setReadMarks(marks) {
    try {
      localStorage.setItem(KEYS.READ_MARKS, JSON.stringify(marks));
    } catch (e) { /* quota exceeded, ignore */ }
  }

  function isLessonRead(num) {
    return getReadMarks().includes(num);
  }

  function markLessonRead(num) {
    const marks = getReadMarks();
    if (!marks.includes(num)) {
      marks.push(num);
      setReadMarks(marks);
    }
  }

  function markLessonUnread(num) {
    const marks = getReadMarks().filter(function (n) { return n !== num; });
    setReadMarks(marks);
  }

  function toggleLessonRead(num) {
    if (isLessonRead(num)) {
      markLessonUnread(num);
      return false;
    } else {
      markLessonRead(num);
      return true;
    }
  }

  /* ============================================================
     Theme (雾态 dark mode)
     ============================================================ */
  function getTheme() {
    try {
      return localStorage.getItem(KEYS.THEME) || '';
    } catch (e) {
      return '';
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme || '');
    try {
      localStorage.setItem(KEYS.THEME, theme || '');
    } catch (e) { /* ignore */ }
    updateThemeToggleUI(theme);
  }

  function toggleTheme() {
    const current = getTheme();
    applyTheme(current === 'fog' ? '' : 'fog');
  }

  function updateThemeToggleUI(theme) {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = theme === 'fog' ? '☀ 晴朗' : '🌫 雾态';
      btn.classList.toggle('active', theme === 'fog');
    }
  }

  /* ============================================================
     Font size
     ============================================================ */
  var SCALES = [0.85, 0.9, 1, 1.1, 1.2, 1.3];
  var SCALE_DEFAULT = 1;

  function getScale() {
    try {
      var val = parseFloat(localStorage.getItem(KEYS.FONT_SIZE));
      return SCALES.indexOf(val) >= 0 ? val : SCALE_DEFAULT;
    } catch (e) {
      return SCALE_DEFAULT;
    }
  }

  function applyScale(scale) {
    document.documentElement.style.setProperty('--font-scale', scale);
    try {
      localStorage.setItem(KEYS.FONT_SIZE, String(scale));
    } catch (e) { /* ignore */ }
  }

  function increaseFontSize() {
    var current = getScale();
    var idx = SCALES.indexOf(current);
    if (idx < SCALES.length - 1) applyScale(SCALES[idx + 1]);
  }

  function decreaseFontSize() {
    var current = getScale();
    var idx = SCALES.indexOf(current);
    if (idx > 0) applyScale(SCALES[idx - 1]);
  }

  /* ============================================================
     Init
     ============================================================ */
  function init() {
    applyTheme(getTheme());
    applyScale(getScale());
    wireControls();
    initScrollTop();

    if (document.getElementById('modulesContainer')) {
      initNavigationPage();
    }
    if (document.querySelector('.lecture-container')) {
      initLecturePage();
    }
  }

  /* ============================================================
     Navigation page
     ============================================================ */
  function initNavigationPage() {
    initFilters();
    initModules();
    updateProgressBar();
    updateCardReadStates();
  }

  function updateProgressBar() {
    var count = getReadMarks().length;
    var fillEl = document.querySelector('.progress-bar .fill');
    var countEl = document.getElementById('progressCount');
    if (fillEl) fillEl.style.width = (count) + '%';
    if (countEl) countEl.innerHTML = '已读 <span>' + count + '</span> / 100 讲';
  }

  function updateCardReadStates() {
    var cards = document.querySelectorAll('.lesson-card[data-lesson]');
    cards.forEach(function (card) {
      var num = parseInt(card.getAttribute('data-lesson'), 10);
      card.classList.toggle('card-read', isLessonRead(num));
    });
  }

  function initModules() {
    var headers = document.querySelectorAll('.module-header');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        var grid = header.parentElement.querySelector('.card-grid');
        var isCollapsed = header.classList.contains('collapsed');
        if (isCollapsed) {
          header.classList.remove('collapsed');
          if (grid) grid.style.display = 'grid';
        } else {
          header.classList.add('collapsed');
          if (grid) grid.style.display = 'none';
        }
      });
    });
  }

  function initFilters() {
    var filterBtns = document.querySelectorAll('.filter-btn, .chip[data-group]');
    var activeModule = 'all';
    var activeType = 'all';

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-group');
        var value = btn.getAttribute('data-value');
        var siblings = document.querySelectorAll('[data-group="' + group + '"]');
        siblings.forEach(function (s) { s.classList.remove('active'); });
        btn.classList.add('active');

        if (group === 'module') activeModule = value;
        else activeType = value;

        applyFilters(activeModule, activeType);
      });
    });
  }

  function applyFilters(moduleVal, typeVal) {
    var moduleBlocks = document.querySelectorAll('.module-block');

    moduleBlocks.forEach(function (block) {
      var blockModule = block.getAttribute('data-module');
      var grid = block.querySelector('.card-grid');
      var header = block.querySelector('.module-header');

      if (moduleVal === 'all' || blockModule === moduleVal) {
        block.style.display = '';
        if (header && header.classList.contains('collapsed')) {
          header.classList.remove('collapsed');
          if (grid) grid.style.display = 'grid';
        }
      } else {
        block.style.display = 'none';
      }
    });

    var cards = document.querySelectorAll('.lesson-card[data-lesson]');
    cards.forEach(function (card) {
      var cardModule = card.getAttribute('data-module');
      var cardType = card.getAttribute('data-type') || 'normal';

      if (moduleVal !== 'all' && cardModule !== moduleVal) {
        card.style.display = 'none';
        return;
      }
      if (typeVal === 'all' || cardType === typeVal) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  /* ============================================================
     Lecture page
     ============================================================ */
  function initLecturePage() {
    var lessonNum = getCurrentLessonNum();
    initMarkReadButton(lessonNum);
    initTOC();
  }

  function getCurrentLessonNum() {
    var el = document.getElementById('lessonNum');
    if (el) return parseInt(el.getAttribute('data-num'), 10);
    var match = window.location.pathname.match(/lesson-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  function initMarkReadButton(lessonNum) {
    var btn = document.getElementById('markReadBtn');
    if (!btn || !lessonNum) return;

    function updateBtn() {
      var isRead = isLessonRead(lessonNum);
      btn.textContent = isRead ? '✓ 已读完' : '标记为已读';
      btn.classList.toggle('marked', isRead);
    }
    updateBtn();

    btn.addEventListener('click', function () {
      toggleLessonRead(lessonNum);
      updateBtn();
    });
  }

  function initTOC() {
    var sections = document.querySelectorAll('[id]');
    var sidebarLinks = document.querySelectorAll('.sidebar-link[href^="#"]');
    if (sections.length === 0 || sidebarLinks.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          sidebarLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { root: null, rootMargin: '-80px 0px -60% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ============================================================
     Scroll to top
     ============================================================ */
  function initScrollTop() {
    var btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 400);
    });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     Wire controls
     ============================================================ */
  function wireControls() {
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    var dec = document.getElementById('fontSizeDecrease');
    var inc = document.getElementById('fontSizeIncrease');
    if (dec) dec.addEventListener('click', decreaseFontSize);
    if (inc) inc.addEventListener('click', increaseFontSize);

    var tocToggle = document.getElementById('tocToggle');
    var tocOverlay = document.getElementById('tocOverlay');
    var tocDrawer = document.getElementById('tocDrawer');
    var tocClose = document.getElementById('tocClose');

    if (tocToggle) {
      tocToggle.addEventListener('click', function () {
        if (tocOverlay) tocOverlay.style.display = 'block';
        if (tocDrawer) tocDrawer.classList.add('open');
      });
    }
    if (tocOverlay) {
      tocOverlay.addEventListener('click', function () {
        tocOverlay.style.display = 'none';
        if (tocDrawer) tocDrawer.classList.remove('open');
      });
    }
    if (tocClose) {
      tocClose.addEventListener('click', function () {
        tocOverlay.style.display = 'none';
        if (tocDrawer) tocDrawer.classList.remove('open');
      });
    }
  }

  window.isLessonRead = isLessonRead;
  window.getReadMarks = getReadMarks;
  window.Phenomenology = { isLessonRead: isLessonRead, getReadMarks: getReadMarks };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
