document.getElementById('saveButton').addEventListener('click', () => {
  const jsonInput = document.getElementById('jsonInput').value;
  try {
    console.log({chrome, jsonInput})
    const userData = JSON.parse(jsonInput);
    chrome.storage.local.set({ userData }, () => {
      alert('Data saved successfully!');
    });
  } catch (e) {
    console.error(e)
    alert('Invalid JSON format');
  }
});

document.getElementById('submitButton').addEventListener('click', () => {
  chrome.storage.local.get('userData', (data) => {
    if (data.userData) {
      const urls = Object.keys(data.userData);
      let index = 0;

      const navigateAndFill = () => {
        if (index < urls.length) {
          const url = urls[index];
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.tabs.update(tabId, { url: url }, () => {
              chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (changeInfo.status === 'complete') {
                  chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                  });
                  chrome.tabs.onUpdated.removeListener(listener);
                  setTimeout(() => {
                    index++;
                    navigateAndFill();
                  }, 3000); // Adjust the timeout as necessary to ensure the script completes
                }
              });
            });
          });
        }
      };

      navigateAndFill();
    } else {
      alert('No data to submit');
    }
  });
});



document.getElementById('viewEvents').addEventListener('click', () => {
  chrome.storage.local.get('userEvents', (data) => {
    const userEvents = data.userEvents || [];
    console.log(JSON.stringify(userEvents, null, 2));
  });
});