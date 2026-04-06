// Theme toggle — persists across pages via localStorage
(function() {
  const saved = localStorage.getItem('pp-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  // Create toggle button
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle light/dark mode');
  btn.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '🌙' : '☀️';

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    if (next === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', next);
    }
    localStorage.setItem('pp-theme', next);
    btn.textContent = next === 'light' ? '🌙' : '☀️';
  });

  document.body.appendChild(btn);
})();
