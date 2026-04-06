// Theme toggle + Floating guestbook popup
(function() {
  const API_URL = 'https://pandemicparadise.colbysthickey.workers.dev';

  // =============================================
  // Theme toggle
  // =============================================
  const saved = localStorage.getItem('pp-theme');
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');

  const themeBtn = document.createElement('button');
  themeBtn.className = 'theme-toggle';
  themeBtn.setAttribute('aria-label', 'Toggle light/dark mode');
  themeBtn.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '🌙' : '☀️';
  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    if (next === 'dark') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('pp-theme', next);
    themeBtn.textContent = next === 'light' ? '🌙' : '☀️';
  });

  // =============================================
  // Guestbook floating button
  // =============================================
  const gbBtn = document.createElement('button');
  gbBtn.className = 'theme-toggle';
  gbBtn.style.bottom = '72px';
  gbBtn.setAttribute('aria-label', 'Open guestbook');
  gbBtn.textContent = '📖';
  gbBtn.addEventListener('click', openGuestbookPopup);

  // Don't show the floating button on the guestbook page itself
  if (!window.location.pathname.includes('guestbook')) {
    document.body.appendChild(gbBtn);
  }
  document.body.appendChild(themeBtn);

  // =============================================
  // Guestbook popup
  // =============================================
  function openGuestbookPopup() {
    // Don't open if already open
    if (document.getElementById('gb-popup-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'gb-popup-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:2000;display:flex;align-items:flex-end;justify-content:flex-end;padding:24px;';

    const popup = document.createElement('div');
    popup.style.cssText = 'background:var(--bg-card);border:1px solid var(--border);width:380px;max-width:calc(100vw - 48px);max-height:80vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);';

    popup.innerHTML = `
      <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <span style="font-family:'Silkscreen',monospace;font-size:13px;color:var(--text-primary)">📖 Guestbook</span>
        <button id="gb-popup-close" style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;padding:0 4px">✕</button>
      </div>
      <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
        <input type="text" id="gb-pop-name" placeholder="Your player name" maxlength="50" style="width:100%;padding:8px 12px;background:var(--bg-deep);border:1px solid var(--border);color:var(--text-primary);font-family:'Lora',Georgia,serif;font-size:13px;outline:none;margin-bottom:8px">
        <textarea id="gb-pop-msg" placeholder="Leave a message..." maxlength="300" style="width:100%;padding:8px 12px;background:var(--bg-deep);border:1px solid var(--border);color:var(--text-primary);font-family:'Lora',Georgia,serif;font-size:13px;outline:none;resize:none;height:60px;margin-bottom:8px"></textarea>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span id="gb-pop-count" style="font-family:'Space Mono',monospace;font-size:9px;color:var(--text-muted)">0 / 300</span>
          <button id="gb-pop-submit" style="font-family:'Silkscreen',monospace;font-size:11px;padding:8px 20px;background:none;border:1px solid var(--green-primary);color:var(--green-primary);cursor:pointer;transition:all 0.2s ease">Sign</button>
        </div>
        <div id="gb-pop-status" style="font-family:'Space Mono',monospace;font-size:10px;margin-top:8px;display:none"></div>
      </div>
      <div id="gb-pop-entries" style="flex:1;overflow-y:auto;padding:12px 20px"></div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Close handlers
    document.getElementById('gb-popup-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
    });

    // Char counter
    const msgInput = document.getElementById('gb-pop-msg');
    const countEl = document.getElementById('gb-pop-count');
    msgInput.addEventListener('input', () => {
      const len = msgInput.value.length;
      countEl.textContent = `${len} / 300`;
      countEl.style.color = len > 280 ? '#f87171' : len > 240 ? 'var(--amber)' : 'var(--text-muted)';
    });

    // Submit
    document.getElementById('gb-pop-submit').addEventListener('click', async () => {
      const name = document.getElementById('gb-pop-name').value.trim();
      const message = document.getElementById('gb-pop-msg').value.trim();
      const statusEl = document.getElementById('gb-pop-status');

      if (!name || !message) {
        statusEl.textContent = 'Please fill in both fields.';
        statusEl.style.cssText = 'font-family:"Space Mono",monospace;font-size:10px;margin-top:8px;display:block;color:#f87171';
        return;
      }

      try {
        const resp = await fetch(`${API_URL}/guestbook/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, message }),
        });
        const data = await resp.json();
        if (data.success) {
          statusEl.textContent = 'Signed! Thanks for stopping by.';
          statusEl.style.cssText = 'font-family:"Space Mono",monospace;font-size:10px;margin-top:8px;display:block;color:var(--green-primary)';
          document.getElementById('gb-pop-name').value = '';
          document.getElementById('gb-pop-msg').value = '';
          countEl.textContent = '0 / 300';
          loadPopupEntries();
          setTimeout(() => { statusEl.style.display = 'none'; }, 2500);
        } else {
          statusEl.textContent = data.error || 'Failed.';
          statusEl.style.cssText = 'font-family:"Space Mono",monospace;font-size:10px;margin-top:8px;display:block;color:#f87171';
        }
      } catch (e) {
        statusEl.textContent = 'Could not connect.';
        statusEl.style.cssText = 'font-family:"Space Mono",monospace;font-size:10px;margin-top:8px;display:block;color:#f87171';
      }
    });

    // Load entries
    loadPopupEntries();
  }

  async function loadPopupEntries() {
    const el = document.getElementById('gb-pop-entries');
    if (!el) return;

    try {
      const resp = await fetch(`${API_URL}/guestbook`);
      const entries = await resp.json();

      if (entries.length === 0) {
        el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-family:\'Space Mono\',monospace;font-size:11px">No signatures yet. Be the first!</div>';
        return;
      }

      el.innerHTML = entries.slice(0, 50).map(entry => {
        const initial = entry.name ? entry.name.charAt(0).toUpperCase() : '?';
        const date = getTimeAgo(new Date(entry.date));
        return `<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="width:28px;height:28px;background:var(--bg-deep);border:1px solid var(--border);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Silkscreen',monospace;font-size:11px;color:var(--green-primary);flex-shrink:0">${escapeHTML(initial)}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:2px">
              <span style="font-family:'Silkscreen',monospace;font-size:10px;color:var(--amber)">${escapeHTML(entry.name)}</span>
              <span style="font-family:'Space Mono',monospace;font-size:8px;color:var(--text-muted)">${date}</span>
            </div>
            <div style="font-size:12px;line-height:1.5;color:var(--text-secondary);word-break:break-word">${escapeHTML(entry.message)}</div>
          </div>
        </div>`;
      }).join('');
    } catch (e) {
      el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:11px">Could not load guestbook.</div>';
    }
  }

  function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  function escapeHTML(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
})();
