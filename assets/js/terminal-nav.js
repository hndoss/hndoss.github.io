/**
 * Terminal Navigation - Interactive shell-like navigation for the blog
 * Supports: cd, ls, cat commands with fuzzy search autocomplete
 */
(function() {
  'use strict';

  // State
  let navData = null;
  let fuse = null;
  let selectedIndex = -1;
  let suggestions = [];
  let lsExpanded = false;

  // DOM Elements
  let input, dropdown, lsOutput, interactive;

  // Configuration
  const FUSE_OPTIONS = {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'slug', weight: 0.5 },
      { name: 'title', weight: 0.7 },
      { name: 'category', weight: 0.3 }
    ],
    threshold: 0.4,
    includeMatches: true,
    minMatchCharLength: 1
  };

  /**
   * Initialize the terminal navigation
   */
  async function init() {
    input = document.getElementById('terminal-input');
    dropdown = document.getElementById('terminal-dropdown');
    lsOutput = document.getElementById('terminal-ls-output');
    interactive = document.querySelector('.terminal-interactive');

    if (!input || !dropdown) return;

    // Load navigation data
    try {
      const response = await fetch('/assets/js/navigation.json');
      navData = await response.json();

      // Build searchable items for Fuse
      const searchItems = [
        ...navData.categories.map(c => ({ ...c, type: 'category' })),
        ...navData.posts.map(p => ({ ...p, type: 'post', name: p.title }))
      ];

      fuse = new Fuse(searchItems, FUSE_OPTIONS);
    } catch (e) {
      console.error('Failed to load navigation data:', e);
      return;
    }

    // Event listeners
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeydown);
    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
    document.addEventListener('click', handleClickOutside);

    // Global keyboard capture - typing anywhere focuses the terminal
    document.addEventListener('keydown', handleGlobalKeydown);

    // Auto-size input to content
    resizeInput();
    input.addEventListener('input', resizeInput);

    // Focus input on page load (desktop only)
    if (window.innerWidth >= 768) {
      setTimeout(() => {
        input.focus();
        // Move cursor to end
        input.setSelectionRange(input.value.length, input.value.length);
      }, 100);
    }
  }

  /**
   * Global keyboard handler - captures typing anywhere on page
   */
  function handleGlobalKeydown(e) {
    // Skip if already focused on input or other form element
    if (document.activeElement === input) return;
    if (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA') return;

    // Skip modifier keys and special keys
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key.length !== 1 && !['Backspace', 'Delete'].includes(e.key)) return;

    // Skip if mobile
    if (window.innerWidth < 768) return;

    // Focus the terminal input
    input.focus();

    // For printable characters, the keypress will naturally add them
    // For backspace/delete, let the input handle it
  }

  /**
   * Resize input to fit content
   */
  function resizeInput() {
    // Use a hidden span to measure text width
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre';
    span.style.font = getComputedStyle(input).font;
    span.textContent = input.value || ' ';
    document.body.appendChild(span);

    const width = span.offsetWidth + 2; // Minimal padding
    document.body.removeChild(span);

    input.style.width = Math.max(5, width) + 'px';
  }

  /**
   * Handle input changes - show fuzzy suggestions
   */
  function handleInput(e) {
    const value = e.target.value.trim();
    hideLsOutput();

    if (!value) {
      hideDropdown();
      return;
    }

    // Parse command and argument
    const { command, arg } = parseCommand(value);

    if (!arg && command !== 'ls') {
      hideDropdown();
      return;
    }

    // For ls without arg, show current directory contents
    if (command === 'ls' && !arg) {
      showLsResults(getCurrentCategory());
      return;
    }

    // Fuzzy search
    const results = fuse.search(arg || '');
    suggestions = results.map(r => r.item);

    if (suggestions.length === 0) {
      hideDropdown();
      return;
    }

    renderDropdown(command, arg);
  }

  /**
   * Handle keyboard events
   */
  function handleKeydown(e) {
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        handleTab();
        break;
      case 'Enter':
        e.preventDefault();
        handleEnter();
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateDropdown(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateDropdown(-1);
        break;
      case 'Escape':
        hideDropdown();
        hideLsOutput();
        break;
    }
  }

  /**
   * Handle Tab - bash-style completion (common prefix)
   */
  function handleTab() {
    if (suggestions.length === 0) return;

    const { command } = parseCommand(input.value);

    // Get all suggestion names/slugs
    const names = suggestions.map(s => s.slug || s.name);

    // Find common prefix
    const prefix = findCommonPrefix(names);

    if (prefix) {
      const newValue = command + ' ' + prefix;
      input.value = newValue;
      handleInput({ target: input });
    }

    // If only one match, complete it fully
    if (suggestions.length === 1) {
      const item = suggestions[0];
      const path = item.type === 'category'
        ? item.slug
        : `${item.category}/${item.slug}`;
      input.value = `${command} ${path}`;
      hideDropdown();
    }
  }

  /**
   * Handle Enter - execute command
   */
  function handleEnter() {
    // If dropdown is open and item selected, use that
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      selectSuggestion(suggestions[selectedIndex]);
      return;
    }

    const value = input.value.trim();
    const { command, arg } = parseCommand(value);

    switch (command) {
      case 'cd':
        executeCD(arg);
        break;
      case 'ls':
        executeLS(arg);
        break;
      case 'cat':
        executeCAT(arg);
        break;
      default:
        shakeInput();
    }
  }

  /**
   * Execute cd command
   */
  function executeCD(path) {
    if (!path || path === '~' || path === '/') {
      window.location.href = '/';
      return;
    }

    if (path === '..') {
      navigateUp();
      return;
    }

    // Clean path
    path = path.replace(/^\.\//, '').replace(/\/$/, '');

    // Try to find matching category or post
    const item = findItem(path);

    if (item) {
      window.location.href = item.url;
    } else {
      shakeInput();
    }
  }

  /**
   * Execute ls command
   */
  function executeLS(path) {
    hideDropdown();

    let category = null;

    if (!path || path === '.' || path === '~' || path === '/') {
      // Show all categories
      category = null;
    } else {
      // Clean path and find category
      path = path.replace(/^\.\//, '').replace(/\/$/, '');
      const cat = navData.categories.find(c => c.slug === path || c.name.toLowerCase() === path.toLowerCase());
      if (cat) {
        category = cat.slug;
      } else {
        shakeInput();
        return;
      }
    }

    showLsResults(category);
  }

  /**
   * Execute cat command (same as cd for posts)
   */
  function executeCAT(path) {
    if (!path) {
      shakeInput();
      return;
    }

    // Clean path
    path = path.replace(/^\.\//, '').replace(/\/$/, '');

    // Find matching post
    const post = navData.posts.find(p =>
      p.slug === path ||
      `${p.category}/${p.slug}` === path ||
      p.title.toLowerCase() === path.toLowerCase()
    );

    if (post) {
      window.location.href = post.url;
    } else {
      shakeInput();
    }
  }

  /**
   * Navigate up one level
   */
  function navigateUp() {
    const currentPath = input.dataset.currentPath || '';

    if (currentPath.includes('/')) {
      // On post page, go to category
      const category = currentPath.split('/')[0];
      const cat = navData.categories.find(c => c.slug === category);
      if (cat) {
        window.location.href = cat.url;
        return;
      }
    }

    // Go home
    window.location.href = '/';
  }

  /**
   * Show ls results inline
   */
  function showLsResults(category) {
    let items = [];

    if (!category) {
      // Show categories
      items = navData.categories.map(c => ({
        name: c.name + '/',
        type: 'dir',
        url: c.url,
        count: c.count
      }));
    } else {
      // Show posts in category
      const posts = navData.posts.filter(p => p.category === category);
      items = posts.map(p => ({
        name: p.slug,
        type: 'file',
        url: p.url,
        date: p.date
      }));
    }

    if (items.length === 0) {
      lsOutput.innerHTML = '<div class="ls-empty">total 0</div>';
    } else {
      const rows = items.map(item => {
        const typeClass = item.type === 'dir' ? 'ls-dir' : 'ls-file';
        const permissions = item.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
        const extra = item.type === 'dir' ? `(${item.count})` : item.date;
        return `
          <a href="${item.url}" class="ls-row ${typeClass}">
            <span class="ls-perms">${permissions}</span>
            <span class="ls-extra">${extra}</span>
            <span class="ls-name">${item.name}</span>
          </a>
        `;
      }).join('');

      lsOutput.innerHTML = `
        <div class="ls-header">total ${items.length}</div>
        ${rows}
      `;
    }

    lsOutput.classList.add('active');
    lsExpanded = true;
  }

  /**
   * Render the dropdown with suggestions
   */
  function renderDropdown(command, query) {
    selectedIndex = -1;

    const html = suggestions.map((item, i) => {
      const icon = item.type === 'category' ? '/' : '';
      const path = item.type === 'category'
        ? item.slug
        : `${item.category}/${item.slug}`;
      const display = item.type === 'category' ? item.name : item.title;

      // Highlight matching characters
      const highlighted = highlightMatch(display, query);

      return `
        <div class="dropdown-item" data-index="${i}" data-path="${path}">
          <span class="dropdown-type">${item.type === 'category' ? 'dir' : 'file'}</span>
          <span class="dropdown-name">${highlighted}${icon}</span>
          ${item.type === 'post' ? `<span class="dropdown-category">${item.category}/</span>` : ''}
        </div>
      `;
    }).join('');

    dropdown.innerHTML = html;
    dropdown.classList.add('active');

    // Add click handlers
    dropdown.querySelectorAll('.dropdown-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index);
        selectSuggestion(suggestions[idx]);
      });
      el.addEventListener('mouseenter', () => {
        selectedIndex = parseInt(el.dataset.index);
        updateDropdownSelection();
      });
    });
  }

  /**
   * Navigate dropdown with arrow keys
   */
  function navigateDropdown(direction) {
    if (suggestions.length === 0) return;

    selectedIndex += direction;

    if (selectedIndex < 0) selectedIndex = suggestions.length - 1;
    if (selectedIndex >= suggestions.length) selectedIndex = 0;

    updateDropdownSelection();
  }

  /**
   * Update dropdown selection highlight
   */
  function updateDropdownSelection() {
    dropdown.querySelectorAll('.dropdown-item').forEach((el, i) => {
      el.classList.toggle('selected', i === selectedIndex);
    });

    // Scroll into view
    const selected = dropdown.querySelector('.dropdown-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Select a suggestion
   */
  function selectSuggestion(item) {
    const { command } = parseCommand(input.value);

    if (command === 'ls' && item.type === 'category') {
      // For ls, show the category contents
      input.value = `ls ${item.slug}`;
      executeLS(item.slug);
    } else {
      // Navigate to the item
      window.location.href = item.url;
    }
  }

  /**
   * Find an item by path
   */
  function findItem(path) {
    // Check categories first
    const cat = navData.categories.find(c =>
      c.slug === path || c.name.toLowerCase() === path.toLowerCase()
    );
    if (cat) return cat;

    // Check posts
    const post = navData.posts.find(p =>
      p.slug === path ||
      `${p.category}/${p.slug}` === path
    );
    if (post) return post;

    return null;
  }

  /**
   * Get current category from page data
   */
  function getCurrentCategory() {
    return input.dataset.currentCategory || null;
  }

  /**
   * Parse command from input
   */
  function parseCommand(value) {
    const parts = value.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase() || '';
    const arg = parts.slice(1).join(' ');
    return { command, arg };
  }

  /**
   * Find common prefix of array of strings (bash-style)
   */
  function findCommonPrefix(strings) {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let prefix = strings[0];

    for (let i = 1; i < strings.length; i++) {
      while (strings[i].indexOf(prefix) !== 0) {
        prefix = prefix.substring(0, prefix.length - 1);
        if (prefix === '') return '';
      }
    }

    return prefix;
  }

  /**
   * Highlight matching characters in text
   */
  function highlightMatch(text, query) {
    if (!query) return text;

    const lower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    let result = '';
    let queryIdx = 0;

    for (let i = 0; i < text.length; i++) {
      if (queryIdx < queryLower.length && lower[i] === queryLower[queryIdx]) {
        result += `<mark>${text[i]}</mark>`;
        queryIdx++;
      } else {
        result += text[i];
      }
    }

    return result;
  }

  /**
   * Shake animation for invalid commands
   */
  function shakeInput() {
    interactive.classList.add('shake');
    setTimeout(() => interactive.classList.remove('shake'), 500);
  }

  /**
   * Hide dropdown
   */
  function hideDropdown() {
    dropdown.classList.remove('active');
    suggestions = [];
    selectedIndex = -1;
  }

  /**
   * Hide ls output
   */
  function hideLsOutput() {
    lsOutput.classList.remove('active');
    lsOutput.innerHTML = '';
    lsExpanded = false;
  }

  /**
   * Handle focus
   */
  function handleFocus() {
    // Cursor is always blinking, no special focus state needed
  }

  /**
   * Handle blur
   */
  function handleBlur() {
    // Delay hiding to allow click on dropdown
    setTimeout(() => {
      if (!dropdown.matches(':hover')) {
        hideDropdown();
      }
    }, 150);
  }

  /**
   * Handle clicks outside
   */
  function handleClickOutside(e) {
    if (!interactive.contains(e.target)) {
      hideDropdown();
      hideLsOutput();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
