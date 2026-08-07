/**
 * 唯识学100讲 · 公共脚本
 * Vijñaptimātratā: Shared Scripts
 */

(function () {
  'use strict';

  /* ============================================================
     localStorage keys
     ============================================================ */
  const KEYS = {
    READ_MARKS: 'vijnaptimatrata_read',
    THEME: 'vijnaptimatrata_theme',
    FONT_SIZE: 'vijnaptimatrata_font_size',
    MODULE_COLLAPSED: 'vijnaptimatrata_module_collapsed',
    ACTIVE_FILTER: 'vijnaptimatrata_filter',
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
     Theme (dark mode)
     ============================================================ */
  function getTheme() {
    try {
      return localStorage.getItem(KEYS.THEME) || 'light';
    } catch (e) {
      return 'light';
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(KEYS.THEME, theme);
    } catch (e) { /* ignore */ }
    updateThemeToggleUI(theme);
  }

  function toggleTheme() {
    const current = getTheme();
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  function updateThemeToggleUI(theme) {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀ 亮色' : '🌙 暗色';
      btn.classList.toggle('active', theme === 'dark');
    }
  }

  /* ============================================================
     Font size
     ============================================================ */
  var FONT_SIZES = [14, 16, 18, 20];
  var FONT_SIZE_DEFAULT = 16;

  function getFontSize() {
    try {
      var val = parseInt(localStorage.getItem(KEYS.FONT_SIZE), 10);
      return FONT_SIZES.indexOf(val) >= 0 ? val : FONT_SIZE_DEFAULT;
    } catch (e) {
      return FONT_SIZE_DEFAULT;
    }
  }

  function applyFontSize(size) {
    document.documentElement.style.setProperty('--font-size-base', size + 'px');
    try {
      localStorage.setItem(KEYS.FONT_SIZE, String(size));
    } catch (e) { /* ignore */ }
  }

  function increaseFontSize() {
    var current = getFontSize();
    var idx = FONT_SIZES.indexOf(current);
    if (idx < FONT_SIZES.length - 1) {
      applyFontSize(FONT_SIZES[idx + 1]);
    }
  }

  function decreaseFontSize() {
    var current = getFontSize();
    var idx = FONT_SIZES.indexOf(current);
    if (idx > 0) {
      applyFontSize(FONT_SIZES[idx - 1]);
    }
  }

  /* ============================================================
     Init (called on every page)
     ============================================================ */
  function init() {
    // Apply saved theme
    applyTheme(getTheme());

    // Apply saved font size
    applyFontSize(getFontSize());

    // Wire up controls
    wireControls();

    // Init scroll-to-top
    initScrollTop();

    // On navigation page: init filters & modules
    if (document.getElementById('modulesContainer')) {
      initNavigationPage();
    }

    // On lecture page: init mark-as-read & TOC
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
    if (fillEl) {
      fillEl.style.width = (count / 100 * 100) + '%';
    }
    if (countEl) {
      countEl.textContent = count + ' / 100';
    }
  }

  function updateCardReadStates() {
    var cards = document.querySelectorAll('.card[data-lesson]');
    cards.forEach(function (card) {
      var num = parseInt(card.getAttribute('data-lesson'), 10);
      if (isLessonRead(num)) {
        card.classList.add('card-read');
      } else {
        card.classList.remove('card-read');
      }
    });
  }

  function initModules() {
    var headers = document.querySelectorAll('.module-header');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        var grid = header.nextElementSibling;
        var isCollapsed = header.classList.contains('collapsed');
        if (isCollapsed) {
          header.classList.remove('collapsed');
          grid.style.display = 'grid';
        } else {
          header.classList.add('collapsed');
          grid.style.display = 'none';
        }
      });
    });
  }

  function initFilters() {
    var filterBtns = document.querySelectorAll('.filter-btn');
    var activeModule = 'all';
    var activeType = 'all';

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-group');
        var value = btn.getAttribute('data-value');

        // Toggle active state within group
        var siblings = document.querySelectorAll('.filter-btn[data-group="' + group + '"]');
        siblings.forEach(function (s) { s.classList.remove('active'); });
        btn.classList.add('active');

        if (group === 'module') {
          activeModule = value;
        } else {
          activeType = value;
        }

        applyFilters(activeModule, activeType);
      });
    });

    // Initialize with "all" active
    var defaultModule = document.querySelector('.filter-btn[data-group="module"][data-value="all"]');
    var defaultType = document.querySelector('.filter-btn[data-group="type"][data-value="all"]');
    if (defaultModule) defaultModule.classList.add('active');
    if (defaultType) defaultType.classList.add('active');
  }

  function applyFilters(moduleVal, typeVal) {
    var cards = document.querySelectorAll('.card[data-lesson]');
    var moduleBlocks = document.querySelectorAll('.module-block');
    var anyVisible = false;

    // If filtering by module, collapse others
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

    // Apply type filter to visible cards
    cards.forEach(function (card) {
      var cardModule = card.getAttribute('data-module');
      var cardType = card.getAttribute('data-type') || 'normal';

      if (moduleVal !== 'all' && cardModule !== moduleVal) {
        card.style.display = 'none';
        return;
      }

      if (typeVal === 'all' || cardType === typeVal) {
        card.style.display = '';
        anyVisible = true;
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
    if (el) {
      return parseInt(el.getAttribute('data-num'), 10);
    }
    // Fallback: parse from URL
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
      // Update sidebar link state if present
      updateSidebarReadState(lessonNum);
    });
  }

  function updateSidebarReadState(lessonNum) {
    var link = document.querySelector('.sidebar-link[href="#markReadBtn"]');
    if (link) {
      var isRead = isLessonRead(lessonNum);
      link.textContent = isRead ? '✓ 已读完' : '标记为已读';
    }
  }

  function initTOC() {
    // Desktop: highlight active section on scroll
    var sections = document.querySelectorAll('.role-section[id], [id]');
    var sidebarLinks = document.querySelectorAll('.sidebar-link[href^="#"]');

    if (sections.length === 0 || sidebarLinks.length === 0) return;

    var observerOptions = {
      root: null,
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          sidebarLinks.forEach(function (link) {
            var href = link.getAttribute('href');
            link.classList.toggle('active', href === '#' + id);
          });
        }
      });
    }, observerOptions);

    sections.forEach(function (section) {
      if (section.id) {
        observer.observe(section);
      }
    });
  }

  /* ============================================================
     Scroll to top
     ============================================================ */
  function initScrollTop() {
    var btn = document.getElementById('scrollTopBtn');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     Wire controls
     ============================================================ */
  function wireControls() {
    // Theme toggle
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    // Font size buttons
    var fontSizeDecrease = document.getElementById('fontSizeDecrease');
    var fontSizeIncrease = document.getElementById('fontSizeIncrease');
    if (fontSizeDecrease) {
      fontSizeDecrease.addEventListener('click', decreaseFontSize);
    }
    if (fontSizeIncrease) {
      fontSizeIncrease.addEventListener('click', increaseFontSize);
    }

    // Mobile TOC toggle
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
        if (tocOverlay) tocOverlay.style.display = 'none';
        if (tocDrawer) tocDrawer.classList.remove('open');
      });
    }
  }

  /* ============================================================
     Expose to global scope for inline handlers
     ============================================================ */
  window.isLessonRead = isLessonRead;
  window.getReadMarks = getReadMarks;
  window.Vijnaptimatrata = {
    isLessonRead: isLessonRead,
    getReadMarks: getReadMarks,
  };

  /* ============================================================
     Run on DOM ready
     ============================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
