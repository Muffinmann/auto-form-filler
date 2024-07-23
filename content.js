async function selectInputs(MAX_RETRY = 5, retryCount = 0) {
  const inputs = document.querySelectorAll('input')
  if (inputs.length === 0 && retryCount < MAX_RETRY) {
    return new Promise(res => {
      setTimeout(() => res(selectInputs(MAX_RETRY, retryCount + 1)), 1000)
    })
  } else {
    return inputs
  }
}

chrome.storage.local.get('userData', async (data) => {
  const url = window.location.href;
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  const nativeInputCheckedSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set;

  if (data.userData && (url in data.userData)) {
    const userData = data.userData[url];
    const inputs = await selectInputs()

    inputs.forEach(input => {
      if (!input) {
        console.log('input unmounted: ', input)
        return;
      }

      const name = input.name;

      if (userData.hasOwnProperty(name)) {
        const value = userData[name];
        if (Array.isArray(value)) {
          if (input.type === 'checkbox' && value.includes(input.value)) {
            nativeInputCheckedSetter.call(input, true)
          }
        } else {
          if (input.type === 'radio' && input.value === value) {
            nativeInputCheckedSetter.call(input, true)
          } else {
            nativeInputValueSetter.call(input, value)
          }
        }

        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
    });
  }
});



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "replay") {
    chrome.storage.local.get('userEvents', (data) => {
      replayActions(data.userEvents)
    })

  }
});

function sleep(time) {
  return new Promise((res) => {
    setTimeout(() => {
      res(true)
    }, time);
  })
}

async function replayActions(savedActions, lastActionTimeStamp = 0) {
  if (!Array.isArray(savedActions)) {
    console.error("actions must be array.")
    return;
  }
  const action = savedActions.shift()

  const timeCost = action.timeStamp - lastActionTimeStamp
  let speedFactor = 1
  if (lastActionTimeStamp !== 0) { // no sleep for the first action
    await sleep(timeCost / speedFactor)
  }

  const element = findElement(action);


  if (element) {
    highlightElement(element);
    if (action.eventType === 'click') {
      if ('click' in element) {
        element.click()
      } else {
        element.dispatchEvent(new Event('click', { bubbles: true }));
      }
    } else if (action.eventType === 'input') {
      element.value = action.value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else {
    console.log('Cannot find element: ', action.target)
    return;
  }

  if (savedActions.length) {
    replayActions(savedActions, action.timeStamp)
  } else {
    removeHighlight();
  }
}


function findElement(elementProfile) {
  const {className, tagName, innerText, target} = elementProfile
  if (className) {
    const cElements = document.getElementsByClassName(className)
    for (const cElement of cElements) {
      if (innerText !== undefined && cElement.innerText.trim() === innerText.trim()) {
        return cElement
      }
      if (cElement.outerHTML === target) {
        return cElement
      }
    }
  } else {
    const elements = document.getElementsByTagName(tagName)
    for (const element of elements) {
      if (innerText !== undefined && element.innerText.trim() === innerText.trim()) {
        return element
      }
      if (element.outerHTML === target) {
        return element
      }
    }
  }
  return null
}

function highlightElement(element) {
  removeHighlight();
  const highlight = document.createElement('div');
  highlight.id = 'replay-highlight';
  highlight.style.position = 'absolute';
  highlight.style.zIndex = '999';
  highlight.style.border = '2px solid red';
  highlight.style.borderRadius = '50%';
  highlight.style.pointerEvents = 'none';
  highlight.style.transition = 'all 0.2s ease-in-out';
  document.body.appendChild(highlight);

  const rect = element.getBoundingClientRect();
  highlight.style.left = `${rect.left + window.scrollX}px`;
  highlight.style.top = `${rect.top + window.scrollY}px`;
  highlight.style.width = `${rect.width}px`;
  highlight.style.height = `${rect.height}px`;
}

function removeHighlight() {
  const highlight = document.getElementById('replay-highlight');
  if (highlight) {
    highlight.remove();
  }
}