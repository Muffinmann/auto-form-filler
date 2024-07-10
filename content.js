chrome.storage.local.get('userData', async (data) => {
  const url = window.location.href;
  const selectInputs = async (retryCount, MAX_RETRY) => {
    const inputs = document.querySelectorAll('input')
    if (inputs.length === 0 && retryCount < MAX_RETRY) {
      retryCount++
      return new Promise(res => {
        setTimeout(() => res(selectInputs()), 1000)
      })
    } else {
      return inputs
    }
  }
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor( window.HTMLInputElement.prototype, 'value').set;
  // const nativeInputCheckedSetter = Object.getOwnPropertyDescriptor( window.HTMLInputElement.prototype, 'checked').set;
  if (data.userData && data.userData[url]) {
    const userData = data.userData[url];
    let retryCount = 0
    const MAX_RETRY = 5
    const inputs = await selectInputs(retryCount, MAX_RETRY)
    inputs.forEach(input => {
      if (!input) {
        console.log('input unmounted: ', input)
        return;
      }
      const name = input.getAttribute('name');
      if (userData.hasOwnProperty(name)) {
        const value = userData[name];
        // switch (input.type) {
        //   case 'checkbox':
        //   case 'radio':
        //     input.checked = value;
        //     // nativeInputCheckedSetter(input, true)
        //     break;
        //   case 'number':
        //     input.value = Number(value);
        //     break;
        //   case 'text':
        //   default:
        //     input.value = value;
        //     break;
        // }
        nativeInputValueSetter.call(input, value);
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
    });
  }
});