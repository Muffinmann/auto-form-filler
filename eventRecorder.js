function recordEvent(event, type) {
  chrome.storage.local.get('recording', (data) => {
    if (data.recording) {
      const element = event.target;
      const elementDetails = {
        host: window.location.href,
        eventType: type,
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        name: element.name,
        value: element.value || null,
        innerText: element.innerText,
        href: element.href || null,
        src: element.src || null,
        timeStamp: event.timeStamp
      };

      chrome.runtime.sendMessage({ action: 'recordEvent', elementDetails });
    }
  })
}

document.addEventListener('click', (event) => {
  recordEvent(event, 'click');
});

document.addEventListener('input', (event) => {
  console.log('captcha input')
  recordEvent(event, 'input');
});

document.addEventListener('change', (event) => {
  console.log('captcha input')
  recordEvent(event, 'change');
});