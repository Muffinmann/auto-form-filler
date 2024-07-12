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
          } else if (input.type === 'number') {
            nativeInputValueSetter.call(input, Number(value))
          } else if (input.type === 'text') {
            nativeInputValueSetter.call(input, value)
          }
        }

        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
    });
  }
});