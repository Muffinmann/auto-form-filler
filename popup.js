document.getElementById('saveButton').addEventListener('click', () => {
  const jsonInput = document.getElementById('jsonInput').value;
  try {
    console.log({chrome, jsonInput})
    const url = window.location.href
    const data = JSON.parse(jsonInput);
    const userData = Object.fromEntries(
      Object.entries(data).map(([url, kvPairs]) => {
        if (url.indexOf('*')> -1) {
          const segments = url.split('*')
          
          // replace wildcard segment with current url

        }
        return [url, kvPairs]
      })
    )
    chrome.storage.local.set({ userData }, () => {
      alert('Data saved successfully!');
    });
  } catch (e) {
    console.error(e)
    alert('Invalid JSON format');
  }
});

/** To get the tab the user is viewing and only in the window they are viewing  */
function getActiveTab() {
  return new Promise((res, rej) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        res(tabs[0])
      })
    } catch(e) {
      rej(e)
    }
  })
}

function getStorageData(key) {
  return new Promise((res, rej) => {
    try {
      chrome.storage.local.get(key, (data) => {
        res(data[key])
      })
    } catch(e) {
      rej(e)
    }
  })
}

async function navigateAndFill(urls) {
  const activeTab = await getActiveTab()
  const url = urls.shift()
  if (url) {
    chrome.tabs.update(activeTab.id, { url: url }, () => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (changeInfo.status === 'complete') {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
          });
          chrome.tabs.onUpdated.removeListener(listener);
          navigateAndFill(urls)
        } 
      });
    });
  }
  
}

document.getElementById('submitButton').addEventListener('click', async () => {
  const userData = await getStorageData('userData')
  if (userData) {
    const urls = Object.keys(data.userData);
    navigateAndFill(urls)
  } else {
    alert('No data to submit!')
  }
});



document.getElementById('viewEvents').addEventListener('click', () => {
  chrome.storage.local.get('userEvents', (data) => {
    const userEvents = data.userEvents || [];
    console.log(JSON.stringify(userEvents, null, 2));
  });
});


document.getElementById('startRecordButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: toggleRecording,
      args: [true]
    });
  });
});
document.getElementById('stopRecordButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: toggleRecording,
      args: [false]
    });
  });
});

function toggleRecording(enable) {
  chrome.storage.local.set({ recording: enable }, () => {
    if (enable) {
      alert('Recording started');
    } else {
      alert('Recording stopped');
    }
  });
}