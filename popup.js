function resolveWildcardUrl(href, target) {
  const scheme = href.slice(0, href.indexOf(":") + 3)
  const sourceStack = href.slice(href.indexOf(":") + 3).split("/")
  const targetStack = target.split("/")
  const resolved = []

  if (targetStack.length === 0) {
    return ""
  }

  while (targetStack.length) {
    if (targetStack[0] === '*') {
      resolved.push(sourceStack.shift())
      targetStack.shift()
    } else {
      resolved.push(targetStack.shift())
      sourceStack.shift()
    }
  }
  return scheme.concat(resolved.join("/"))
}

document.getElementById('openInTab').addEventListener('click', () => {
  chrome.tabs.create({ url: 'popup.html' })
})


document.getElementById('saveButton').addEventListener('click', async () => {
  const jsonInput = document.getElementById('jsonInput').value;
  try {
    const href = (await getActiveTab()).url
    const data = JSON.parse(jsonInput);
    const userData = Object.fromEntries(
      Object.entries(data).map(([url, kvPairs]) => {
        if (url.indexOf('*') > -1) {
          return [resolveWildcardUrl(href, url), kvPairs]
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
    } catch (e) {
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
    } catch (e) {
      rej(e)
    }
  })
}

async function navigateAndFill(urls) {
  try {
    const activeTab = await getActiveTab()
    const url = urls.shift()
    console.log({ activeTab, url })
    if (url) {
      chrome.tabs.update(activeTab.id, { url: url }, (updatedTab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === activeTab.id && changeInfo.status === 'complete') {
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
  } catch (e) {
    console.error(`An error occurred during navigation and fill: ${e}`)
  }

}

document.getElementById('submitButton').addEventListener('click', async () => {
  const userData = await getStorageData('userData')
  if (userData) {
    const urls = Object.keys(userData);
    navigateAndFill(urls)
  } else {
    alert('No data to submit!')
  }
});



document.getElementById('viewEvents').addEventListener('click', async () => {
  const userEvents = await getStorageData('userEvents') || []
  console.log(JSON.stringify(userEvents, null, 2));
});

document.getElementById('urlMask').addEventListener('change', (e) => {
  const urlMask = e.target.value
  chrome.storage.local.set({ urlMask }, () => { })
})

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


document.getElementById('generateValues').addEventListener('click', async () => {
  const userEvents = await getStorageData('userEvents') || []
  const changeEvents = userEvents.filter((e) => e.eventType === 'change')
  const urlWithKV = changeEvents.reduce((prev, crr) => {
    const url = crr.host
    const value = crr.value
    const name = crr.name
    if (!(url in prev)) {
      prev[url] = {}
    }
    prev[url][name] = value

    return prev
  }, {})
  chrome.storage.local.set({
    userData: urlWithKV
  })
  init()

});

document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.local.clear()
  alert('Storage cleared!')
});


document.getElementById('replay').addEventListener('click', async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "replay" });
  });
});

function isInPopup() {
  return (typeof chrome != undefined && chrome.extension) ?
    chrome.extension.getViews({ type: "popup" }).length > 0 : null;
}

function applyMask(url, mask) {
  // const scheme = url.slice(0, url.indexOf(':') + 3)
  if (!mask) {
    return url
  }
  const urlSegments = url.slice(url.indexOf(':') + 3).split('/')
  const maskSegments = mask.split('/')
  const res = []

  while (urlSegments.length) {
    if (maskSegments[0] === '<any>') {
      res.push(urlSegments.shift())
      maskSegments.shift()
      continue
    }
    // mask is "*" or string literal
    res.push(maskSegments.shift())
    urlSegments.shift()
  }
  return res.join('/')
}
async function init() {
  const textarea = document.getElementById('jsonInput');
  const userData = await getStorageData('userData')
  const urlMask = await getStorageData('urlMask')

  if (userData) {
    const maskedData = Object.fromEntries(
      Object.entries(userData).map(([url, kv]) => {
        return [applyMask(url, urlMask), kv]
      })
    )
    textarea.value = JSON.stringify(maskedData, null, 2)
  }

  const urlMaskInput = document.getElementById('urlMask')
  if (urlMask) {
    urlMaskInput.value = urlMask
  }
}

init()