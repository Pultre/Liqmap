# ⚡ LiqMap — Coinglass Liquidation Heatmap on TradingView

A Chrome extension that detects the token you're currently watching on TradingView and opens its Coinglass liquidation heatmap in one click — no copy-pasting, no searching.

---

## 📦 Installation (Chrome / Brave / Edge)

1. Download and **unzip** this folder
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top right)
4. Click **"Load unpacked"**
5. Select the unzipped `coinglass-extension` folder
6. The extension icon appears in your toolbar ✓

---

## 🚀 Usage

1. Open **TradingView** on any crypto chart
2. Press **`Alt + L`** to toggle the LiqMap panel
3. Or click the ⚡ icon in the Chrome toolbar → "SHOW / HIDE"
4. The panel auto-detects your current token and shows a button to open its liquidation heatmap on Coinglass

---

## 🎮 Features

- **Auto-detects** the active symbol on TradingView (BTC, ETH, SOL, any altcoin)
- **One-click** access to the exact Coinglass heatmap page for that token
- **Drag & drop** the panel anywhere on screen
- **Resize** from the bottom-right corner
- **↺ Refresh** — reloads the heatmap manually
- **↗ Open** — opens Coinglass in a new tab for the current token
- **− Minimize** — collapses the panel without closing
- Panel position and size **saved** between sessions

---

## ⌨️ Keyboard Shortcut

| Shortcut | Action |
|----------|--------|
| `Alt + L` | Toggle the LiqMap panel |

---

## ⚠️ About the iframe

Coinglass blocks embedding their pages in iframes (X-Frame-Options header).
If the heatmap doesn't load inside the panel, click **"Open heatmap →"** to open it directly in a new tab on the correct token.

---

## 🔧 Adding a token manually

In `content.js`, add an entry to `SYMBOL_MAP`:
```js
'NEWUSDT': 'NEW',
```

---

## 🛡️ Privacy

This extension does not collect any data, make any network requests, or communicate with any server. It only reads the page title of TradingView to detect the current symbol, and opens Coinglass URLs in your browser.

Source code is fully open and readable in the extension folder.
