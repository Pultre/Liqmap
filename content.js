// ─── Trading Extension V2 — Content Script ───────────────────────────────────
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
    'HYPEUSDT': 'HYPE',
  };

  let overlayVisible = false;
  let currentCoin = null;
  let overlayEl = null;

  // Cache CoinGecko slugs pour éviter les requêtes répétées
  const geckoCache = {};
  const geckoTwitterCache = {};

  // ── Resolve Twitter handle via CoinGecko ───────────────────────────────────
  async function resolveTwitter(coin) {
    try {
      // Reuse slug from geckoCache if available, else fetch search first
      let slug = geckoCache[coin];
      if (!slug) {
        const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${coin}`);
        const data = await res.json();
        const match = data.coins?.find(c => c.symbol.toUpperCase() === coin.toUpperCase()) || data.coins?.[0];
        if (match?.id) { geckoCache[coin] = match.id; slug = match.id; }
      }
      if (!slug) return;

      // Fetch full coin data for twitter handle
      const res2 = await fetch(`https://api.coingecko.com/api/v3/coins/${slug}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`);
      const data2 = await res2.json();
      const handle = data2.links?.twitter_screen_name;

      if (handle) {
        geckoTwitterCache[coin] = handle;
        // Only update UI if still on same coin
        if (currentCoin === coin) {
          const twitterBtn = document.getElementById('te-twitter-btn');
          if (twitterBtn) {
            twitterBtn.href = `https://twitter.com/${handle}`;
            twitterBtn.title = `@${handle} on X`;
            twitterBtn.style.display = 'inline-flex';
          }
        }
      }
    } catch(e) {
      console.warn('[Trading Extension] Twitter resolve failed:', e);
    }
  }

  // ── Extract symbol from TradingView ────────────────────────────────────────
  function extractSymbol() {
    const titleMatch = document.title.match(/^([A-Z0-9]+)/i);
    if (titleMatch) {
      let sym = titleMatch[1].toUpperCase().replace(/\.(P|PF|PM)$/i, '');
      if (sym.length >= 3) return sym;
    }
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

  function getCoin(tvSymbol) {
    if (!tvSymbol) return null;
    if (SYMBOL_MAP[tvSymbol]) return SYMBOL_MAP[tvSymbol];
    const base = tvSymbol
      .replace(/\.(P|PF|PM)$/i, '')
      .replace(/(USDT|BUSD|FDUSD|USDC|PERP|USD)$/i, '');
    return base.length >= 2 ? base : null;
  }

  function buildCoinglassUrls(coin) {
    return {
      heatmap: `https://www.coinglass.com/pro/futures/LiquidationHeatMap?symbol=${coin}USDT&coin=${coin}`,
      oi:      `https://www.coinglass.com/open-interest/${coin}`,
      fr:      `https://www.coinglass.com/currencies/${coin}/futures`,
    };
  }

  // ── CoinGecko slug lookup → Tokenomist URL ─────────────────────────────────
  async function getTokenomistUrl(coin) {
    // Cache hit
    if (geckoCache[coin]) return `https://tokenomist.ai/${geckoCache[coin]}`;

    try {
      setUnlocksBtn('loading');
      const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${coin}`);
      const data = await res.json();
      const match = data.coins?.find(c =>
        c.symbol.toUpperCase() === coin.toUpperCase()
      ) || data.coins?.[0];

      if (match?.id) {
        geckoCache[coin] = match.id;
        setUnlocksBtn('ready');
        return `https://tokenomist.ai/${match.id}`;
      }
    } catch (e) {
      console.warn('[Trading Extension] CoinGecko lookup failed:', e);
    }

    setUnlocksBtn('error');
    // Fallback : essai avec le coin en minuscule directement
    return `https://tokenomist.ai/${coin.toLowerCase()}`;
  }

  // ── Update unlock button state ─────────────────────────────────────────────
  function setUnlocksBtn(state) {
    const btn = document.getElementById('te-btn-unlocks');
    const label = document.getElementById('te-unlocks-label');
    if (!btn || !label) return;

    if (state === 'loading') {
      btn.style.opacity = '0.6';
      btn.style.pointerEvents = 'none';
      label.textContent = 'Resolving…';
    } else if (state === 'ready') {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      label.textContent = 'Token Unlocks';
    } else if (state === 'error') {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      label.textContent = 'Token Unlocks (?)';
    }
  }

  // ── Create overlay ─────────────────────────────────────────────────────────
  function createOverlay() {
    if (overlayEl) return;
    overlayEl = document.createElement('div');
    overlayEl.id = 'te-overlay';
    overlayEl.innerHTML = `
      <div id="te-panel">
        <div id="te-header">
          <div id="te-header-left">
            <span id="te-logo">⚡</span>
            <span id="te-title">Trading Extension</span>
            <span id="te-badge">—</span>
            <a id="te-twitter-btn" href="#" target="_blank" title="Twitter / X" style="display:none">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#1da1f2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
          <div id="te-header-right">
            <button class="te-btn" id="te-minimize" title="Minimize">−</button>
            <button class="te-btn te-btn-close" id="te-close" title="Close">×</button>
          </div>
        </div>
        <div id="te-body">
          <div id="te-actions">
            <button class="te-action-btn" id="te-btn-heatmap">
              <span class="te-action-icon">🔥</span>
              <span class="te-action-label">Liq. Heatmap</span>
              <span class="te-action-arrow">↗</span>
            </button>
            <button class="te-action-btn" id="te-btn-oi">
              <span class="te-action-icon">📊</span>
              <span class="te-action-label">Open Interest</span>
              <span class="te-action-arrow">↗</span>
            </button>
            <button class="te-action-btn" id="te-btn-fr">
              <span class="te-action-icon">💰</span>
              <span class="te-action-label">Funding Rate</span>
              <span class="te-action-arrow">↗</span>
            </button>
            <button class="te-action-btn te-action-btn-alt" id="te-btn-unlocks">
              <span class="te-action-icon">🔓</span>
              <span class="te-action-label" id="te-unlocks-label">Token Unlocks</span>
              <span class="te-action-arrow">↗</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlayEl);
    setupInteractions();
    loadSettings();
  }

  // ── Update panel for current coin ──────────────────────────────────────────
  function updatePanel(symbol) {
    const coin = getCoin(symbol);
    if (!coin) return;
    currentCoin = coin;

    const badge = document.getElementById('te-badge');
    if (badge) badge.textContent = coin;

    const urls = buildCoinglassUrls(coin);
    const btnHeatmap = document.getElementById('te-btn-heatmap');
    const btnOi = document.getElementById('te-btn-oi');
    const btnFr = document.getElementById('te-btn-fr');
    const btnUnlocks = document.getElementById('te-btn-unlocks');
    const twitterBtn = document.getElementById('te-twitter-btn');

    if (btnHeatmap) btnHeatmap.onclick = () => window.open(urls.heatmap, '_blank');
    if (btnOi) btnOi.onclick = () => window.open(urls.oi, '_blank');
    if (btnFr) btnFr.onclick = () => window.open(urls.fr, '_blank');

    // Tokenomist — résolution async via CoinGecko
    if (btnUnlocks) {
      if (geckoCache[coin]) {
        setUnlocksBtn('ready');
        btnUnlocks.onclick = () => window.open(`https://tokenomist.ai/${geckoCache[coin]}`, '_blank');
      } else {
        setUnlocksBtn('ready');
        btnUnlocks.onclick = async () => {
          const url = await getTokenomistUrl(coin);
          window.open(url, '_blank');
        };
      }
    }

    // Twitter — hide while resolving, show when found
    if (twitterBtn) {
      twitterBtn.style.display = 'none';
      if (geckoCache[coin] && geckoTwitterCache[coin]) {
        twitterBtn.href = `https://twitter.com/${geckoTwitterCache[coin]}`;
        twitterBtn.style.display = 'inline-flex';
      } else {
        resolveTwitter(coin);
      }
    }
  }

  // ── Drag & interactions ────────────────────────────────────────────────────
  function setupInteractions() {
    const panel = document.getElementById('te-panel');
    const header = document.getElementById('te-header');
    let minimized = false;

    let isDragging = false, startX, startY, startLeft, startTop;
    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('te-btn')) return;
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

    document.getElementById('te-close').onclick = () => hideOverlay();
    document.getElementById('te-minimize').onclick = () => {
      minimized = !minimized;
      document.getElementById('te-body').style.display = minimized ? 'none' : 'flex';
      document.getElementById('te-minimize').textContent = minimized ? '+' : '−';
      saveSettings();
    };
  }

  function saveSettings() {
    const panel = document.getElementById('te-panel');
    if (!panel) return;
    try {
      localStorage.setItem('te_settings', JSON.stringify({
        left: panel.style.left, top: panel.style.top,
      }));
    } catch(e) {}
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('te_settings') || '{}');
      const panel = document.getElementById('te-panel');
      if (!panel) return;
      if (s.left) { panel.style.left = s.left; panel.style.right = 'auto'; }
      if (s.top) { panel.style.top = s.top; panel.style.bottom = 'auto'; }
    } catch(e) {}
  }

  function showOverlay() {
    if (!overlayEl) createOverlay();
    overlayEl.style.display = 'block';
    overlayVisible = true;
    const sym = extractSymbol();
    if (sym) updatePanel(sym);
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
      if (sym && sym !== lastSymbol) {
        lastSymbol = sym;
        updatePanel(sym);
      }
    }
    setInterval(checkSymbol, 1500);
    document.addEventListener('click', () => setTimeout(checkSymbol, 300));
  }

  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'l') {
      e.preventDefault();
      overlayVisible ? hideOverlay() : showOverlay();
    }
  });

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'toggle') overlayVisible ? hideOverlay() : showOverlay();
    });
  }

  startSymbolWatcher();
  console.log('[Trading Extension V2] Loaded — Alt+L to toggle');
})();
