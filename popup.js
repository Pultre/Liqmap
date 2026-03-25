document.getElementById('toggleBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) { document.getElementById('statusText').textContent = 'OPEN TRADINGVIEW FIRST'; return; }
  if (!tab.url?.includes('tradingview.com')) { document.getElementById('statusText').textContent = 'TRADINGVIEW PAGE REQUIRED'; return; }
  chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  document.getElementById('statusText').textContent = 'PANEL TOGGLED ✓';
  setTimeout(window.close, 600);
});
