// Handle tab creation and navigation.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'recordClick') {
    chrome.storage.local.get('clickData', (data) => {
      const clickData = data.clickData || [];
      clickData.push(message.elementDetails);
      chrome.storage.local.set({ clickData });
    });
  }

  if (message.action === 'getUserData') {
    chrome.storage.local.get('userData', (data) => {
      sendResponse({ userData: data.userData });
    });
    return true; // Indicates that the response will be sent asynchronously
  }
});

