chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'enable') {
    const { type, tabId } = msg;

    chrome.scripting.executeScript({
      target: { tabId },
      files: ['colorUtils.js', 'daltonize.js', 'contrast.js', 'colorFixer.js', 'content.js']
    }).then(function () {
      chrome.tabs.sendMessage(tabId, { action: 'scan', type }, function (response) {
        sendResponse(response || { action: 'scanResult', count: 0 });
      });
    }).catch(function () {
      chrome.tabs.sendMessage(tabId, { action: 'scan', type }, function (response) {
        sendResponse(response || { action: 'scanResult', count: 0 });
      });
    });

    return true;
  }

  if (msg.action === 'disable') {
    const { tabId } = msg;

    chrome.tabs.sendMessage(tabId, { action: 'remove' }, function (response) {
      sendResponse(response || { action: 'removeResult' });
    });

    return true;
  }
});
