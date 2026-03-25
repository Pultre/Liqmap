# Trading Extension — Changelog

---

## V2 — Current

**Twitter / X button + panel improvements**

- Added X (Twitter) icon button next to the coin badge in the header
- Automatically resolves the project's Twitter handle via CoinGecko free API
- Button appears only when a handle is found, hidden otherwise
- Handle cached per token — no repeated requests within the same session
- Removed section labels (COINGLASS, TOKENOMIST) for a cleaner, more compact panel
- Removed "Opens in a new tab" footer text
- Reduced padding and spacing throughout the panel
- New icon: gold lightning bolt on transparent background, visible in Chrome toolbar

---

## V1

**Initial public release**

- Chrome extension injected on TradingView pages (Chrome / Brave / Edge)
- Floating draggable panel toggled with `Alt+L`
- Auto-detects the active token from TradingView page title
- Strips perpetual contract suffix (`.P`, `.PF`) from symbol automatically
- **Coinglass** buttons (open in new tab):
  - 🔥 Liquidation Heatmap
  - 📊 Open Interest
  - 💰 Funding Rate
- **Tokenomist** button:
  - 🔓 Token Unlocks — resolves the correct page via CoinGecko free API
- Panel is draggable, position saved between sessions
- Minimize and close buttons
- Dark trading terminal aesthetic — JetBrains Mono, amber/gold color scheme
- Works with BTC, ETH, SOL, and any altcoin automatically
