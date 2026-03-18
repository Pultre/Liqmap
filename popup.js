// ─── LiqMap Content Script ───────────────────────────────────────────────────
// Detects the active symbol on TradingView and opens the Coinglass heatmap

(function () {
  'use strict';

  const SYMBOL_MAP = {
    'BTCUSDT': 'BTC', 'BTCPERP': 'BTC', 'XBTUSD': 'BTC',
    'ETHUSDT': 'ETH', 'ETHPERP': 'ETH', 'ETHUSD': 'ETH',
    'SOLUSDT': 'SOL', 'SOLPERP': 'SOL',
    'BNBUSDT': 'BNB', 'BNBPERP': 'BNB',
    'XRPUSDT': 'XRP', 'XRPPERP': 'XRP',
    'ADAUSDT': 'ADA', 'ADAPERP': 'ADA',
    'DOGEUSDT': 'DOGE', 'DOGEPERP': 'DOGE',
    'AVAXUSDT': 'AVAX', 'AVAXPERP': 'AVAX',
    'DOTUSDT': 'DOT', 'DOTPERP': 'DOT',
    'MATICUSDT': 'MATIC', 'LINKUSDT': 'LINK',
    'LTCUSDT': 'LTC', 'UNIUSDT': 'UNI',
    'ATOMUSDT': 'ATOM', 'NEARUSDT': 'NEAR',
    'APTUSDT': 'APT', 'ARBUSDT': 'ARB',
    'OPUSDT': 'OP', 'INJUSDT': 'INJ',
    'SUIUSDT': 'SUI', 'TIAUSDT': 'TIA',
    'WIFUSDT': 'WIF', 'JUPUSDT': 'JUP',
    'PENGUUSDT': 'PENGU', 'TRUMPUSDT': 'TRUMP',
    'ONDOUSDT': 'ONDO', 'EIGENUSDT': 'EIGEN',
  };

  let overlayVisible = false;
  let currentSymbol = null;
  let overlayEl = null;

  function extractSymbol() {
    // Method 1: page title (most reliable)
    const titleMatch = document.title.match(/^([A-Z0-9]+)/i);
    if (titleMatch) {
      let sym = titleMatch[1].toUpperCase();
      sym = sym.replace(/\.(P|PF|PM)$/i, '');
      if (sym.length >= 3) return sym;
    }
    // Method 2: "Change symbol" button
    const allBtns = [...document.querySelectorAll('button[aria-label="Change symbol"]')];
    for (const btn of allBtns) {
      const text = btn.textContent.trim();
      if (text.length >= 3) {
        let sym = text.toUpperCase().replace(/\.(P|PF|PM)$/i, '');
        if (sym.length >= 3) return sym;
      }
    }
    return null;
  }

  function getCoinglassCoin(tvSymbol) {
    if (!tvSymbol) return null;
    if (SYMBOL_MAP[tvSymbol]) return SYMBOL_MAP[tvSymbol];
    const base = tvSymbol
      .replace(/\.(P|PF|PM)$/i, '')
      .replace(/(USDT|BUSD|FDUSD|USDC|PERP|USD)$/i, '');
    return base.length >= 2 ? base : null;
  }

  function buildCoinglassUrl(coin) {
    return `https://www.coinglass.com/pro/futures/LiquidationHeatMap?symbol=${coin}USDT&coin=${coin}`;
  }

  function createOverlay() {
    if (overlayEl) return;
    overlayEl = document.createElement('div');
    overlayEl.id = 'liqmap-overlay';
    overlayEl.innerHTML = `
      <div id="liqmap-panel">
        <div id="liqmap-header">
          <div id="liqmap-header-left">
            <span id="liqmap-logo">⚡</span>
            <span id="liqmap-title">LiqMap</span>
            <span id="liqmap-coin-badge">—</span>
          </div>
          <div id="liqmap-controls">
            <button class="liqmap-btn" id="liqmap-refresh" title="Refresh">↺</button>
            <button class="liqmap-btn" id="liqmap-external" title="Open Coinglass">↗</button>
            <button class="liqmap-btn" id="liqmap-minimize" title="Minimize">−</button>
            <button class="liqmap-btn liqmap-btn-close" id="liqmap-close" title="Close">×</button>
          </div>
        </div>
        <div id="liqmap-body">
          <div id="liqmap-loading">
            <div class="liqmap-spinner"></div>
            <div class="liqmap-loading-text">Loading heatmap…</div>
          </div>
          <iframe id="liqmap-iframe" src="" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" loading="lazy"></iframe>
          <div id="liqmap-blocked" style="display:none">
            <div class="liqmap-blocked-icon">🔒</div>
            <div class="liqmap-blocked-title">Iframe blocked by Coinglass</div>
            <div class="liqmap-blocked-sub">Open the heatmap directly in a new tab</div>
            <button id="liqmap-open-direct">Open heatmap →</button>
          </div>
        </div>
        <div id="liqmap-resize-handle"></div>
      </div>
    `;
    document.body.appendChild(overlayEl);
    setupInteractions();
    loadSettings();
  }

  function loadHeatmap(symbol) {
    const coin = getCoinglassCoin(symbol);
    if (!coin) return;
    const url = buildCoinglassUrl(coin);
    const iframe = document.getElementById('liqmap-iframe');
    const badge = document.getElementById('liqmap-coin-badge');
    const loading = document.getElementById('liqmap-loading');
    const blocked = document.getElementById('liqmap-blocked');
    const extBtn = document.getElementById('liqmap-external');
    if (!iframe) return;
    badge.textContent = coin;
    loading.style.display = 'flex';
    iframe.style.display = 'none';
    blocked.style.display = 'none';
    iframe.src = '';
    setTimeout(() => { iframe.src = url; }, 50);
    extBtn.onclick = () => window.open(url, '_blank');
    document.getElementById('liqmap-open-direct').onclick = () => window.open(url, '_blank');
    iframe.onload = () => {
      loading.style.display = 'none';
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body && doc.body.innerHTML.length > 100) {
          iframe.style.display = 'block';
        } else {
          iframe.style.display = 'none';
          blocked.style.display = 'flex';
        }
      } catch (e) {
        iframe.style.display = 'block';
        loading.style.display = 'none';
      }
    };
    iframe.onerror = () => {
      loading.style.display = 'none';
      iframe.style.display = 'none';
      blocked.style.display = 'flex';
    };
    currentSymbol = symbol;
  }

  function setupInteractions() {
    const panel = document.getElementById('liqmap-panel');
    const header = document.getElementById('liqmap-header');
    const resizeHandle = document.getElementById('liqmap-resize-handle');
    let minimized = false;
    let isDragging = false, startX, startY, startLeft, startTop;
    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('liqmap-btn')) return;
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      startLeft = panel.offsetLeft; startTop = panel.offsetTop;
      document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      panel.style.left = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, startLeft + dx)) + 'px';
      panel.style.top = Math.max(0, Math.min(window.innerHeight - 40, startTop + dy)) + 'px';
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => {
      isDragging = false;
      document.body.style.userSelect = '';
      saveSettings();
    });
    let isResizing = false, resStartX, resStartY, resStartW, resStartH;
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      resStartX = e.clientX; resStartY = e.clientY;
      resStartW = panel.offsetWidth; resStartH = panel.offsetHeight;
      e.stopPropagation();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      panel.style.width = Math.max(320, resStartW + (e.clientX - resStartX)) + 'px';
      panel.style.height = Math.max(200, resStartH + (e.clientY - resStartY)) + 'px';
    });
    document.addEventListener('mouseup', () => { isResizing = false; saveSettings(); });
    document.getElementById('liqmap-close').onclick = () => { hideOverlay(); };
    document.getElementById('liqmap-minimize').onclick = () => {
      minimized = !minimized;
      document.getElementById('liqmap-body').style.display = minimized ? 'none' : 'flex';
      document.getElementById('liqmap-minimize').textContent = minimized ? '+' : '−';
      resizeHandle.style.display = minimized ? 'none' : 'block';
    };
    document.getElementById('liqmap-refresh').onclick = () => {
      if (currentSymbol) loadHeatmap(currentSymbol);
    };
  }

  function saveSettings() {
    const panel = document.getElementById('liqmap-panel');
    if (!panel) return;
    const settings = { left: panel.style.left, top: panel.style.top, width: panel.style.width, height: panel.style.height };
    try { localStorage.setItem('liqmap_settings', JSON.stringify(settings)); } catch(e) {}
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('liqmap_settings') || '{}');
      const panel = document.getElementById('liqmap-panel');
      if (!panel) return;
      if (s.left) { panel.style.left = s.left; panel.style.right = 'auto'; }
      if (s.top) { panel.style.top = s.top; panel.style.bottom = 'auto'; }
      if (s.width) panel.style.width = s.width;
      if (s.height) panel.style.height = s.height;
    } catch(e) {}
  }

  function showOverlay() {
    if (!overlayEl) createOverlay();
    overlayEl.style.display = 'block';
    overlayVisible = true;
    const sym = extractSymbol();
    if (sym) loadHeatmap(sym);
    else document.getElementById('liqmap-coin-badge').textContent = '?';
  }

  function hideOverlay() {
    if (overlayEl) overlayEl.style.display = 'none';
    overlayVisible = false;
  }

  function startSymbolWatcher() {
    let lastSymbol = null;
    function checkSymbol() {
      if (!overlayVisible) return;
      const sym = extractSymbol();
      if (sym && sym !== lastSymbol) { lastSymbol = sym; loadHeatmap(sym); }
    }
    setInterval(checkSymbol, 1500);
    document.addEventListener('click', () => { setTimeout(checkSymbol, 300); });
  }

  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'l') { e.preventDefault(); overlayVisible ? hideOverlay() : showOverlay(); }
  });

  window.addEventListener('message', (e) => {
    if (e.data?.type === 'LIQMAP_TOGGLE') overlayVisible ? hideOverlay() : showOverlay();
  });

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'toggle') overlayVisible ? hideOverlay() : showOverlay();
      if (msg.action === 'getSymbol') return extractSymbol();
    });
  }

  startSymbolWatcher();
  console.log('[LiqMap] Extension loaded — Alt+L to toggle the heatmap');
})();
