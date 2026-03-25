# ⚡ Trading Extension

A Chrome extension that detects the token you're watching on TradingView and gives you one-click access to Coinglass and Tokenomist data — liquidation heatmap, open interest, funding rates, token unlocks, and the project's Twitter — all without leaving your chart.

---

## Installation (Chrome / Brave / Edge)

1. Download and **unzip** this folder
2. Go to `chrome://extensions` in your browser
3. Enable **Developer mode** (toggle top right)
4. Click **"Load unpacked"**
5. Select the unzipped folder
6. The ⚡ icon appears in your toolbar ✓

---

## Usage

1. Open **TradingView** on any crypto chart
2. Press **`Alt + L`** to toggle the panel
3. The panel auto-detects your current token and shows quick-access buttons

---

## Features

| Button | Destination |
|--------|-------------|
| 🔥 Liq. Heatmap | Coinglass liquidation heatmap |
| 📊 Open Interest | Coinglass OI page |
| 💰 Funding Rate | Coinglass funding rate page |
| 🔓 Token Unlocks | Tokenomist unlock schedule |
| ⚡ X icon | Project's Twitter / X profile |

- **Auto-detects** any token on TradingView (BTC, ETH, SOL, altcoins, perpetuals)
- **Twitter handle** resolved automatically via CoinGecko free API
- **Tokenomist slug** resolved automatically via CoinGecko free API
- Panel is **draggable** — position saved between sessions
- **`Alt + L`** keyboard shortcut to show/hide

---

## Privacy

This extension does not collect any data or communicate with any external server except:
- **CoinGecko public API** (free, no key required) — to resolve token slugs and Twitter handles
- **Coinglass** and **Tokenomist** — only when you click a button

All source code is readable in the extension folder.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
