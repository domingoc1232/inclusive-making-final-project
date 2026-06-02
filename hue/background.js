chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'enable') {
    const { type, tabId } = msg;

    function doScan() {
      chrome.tabs.sendMessage(tabId, { action: 'scan', type }, function (response) {
        if (chrome.runtime.lastError) {
          sendResponse({ action: 'scanResult', count: 0 });
          return;
        }
        sendResponse(response || { action: 'scanResult', count: 0 });
      });
    }

    chrome.scripting.executeScript({
      target: { tabId },
      files: ['colorUtils.js', 'daltonize.js', 'contrast.js', 'colorFixer.js', 'content.js']
    }).then(doScan).catch(doScan);

    return true;
  }

  if (msg.action === 'disable') {
    const { tabId } = msg;

    chrome.tabs.sendMessage(tabId, { action: 'remove' }, function (response) {
      if (chrome.runtime.lastError) {
        sendResponse({ action: 'removeResult' });
        return;
      }
      sendResponse(response || { action: 'removeResult' });
    });

    return true;
  }
});
