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
  if (message.action === 'recordEvent') {
    chrome.storage.local.get('userEvents', (data) => {
      const userEvents = data.userEvents || [];
      userEvents.push(message.elementDetails);
      chrome.storage.local.set({ userEvents });
    });
  }

  if (message.action === 'getUserData') {
    chrome.storage.local.get('userData', (data) => {
      sendResponse({ userData: data.userData });
    });
    return true; // Indicates that the response will be sent asynchronously
  }
});

