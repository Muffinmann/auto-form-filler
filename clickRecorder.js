function recordEvent(event, type) {
  const element = event.target;
  const elementDetails = {
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

document.addEventListener('click', (event) => {
  recordEvent(event, 'click');
});

document.addEventListener('input', (event) => {
  recordEvent(event, 'input');
});
