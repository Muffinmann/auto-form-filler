function generateSelector(element) {
    if (element.id) {
        return '#' + CSS.escape(element.id);
    }
    
    let path = [];
    while (element.nodeType === Node.ELEMENT_NODE) {
        let selector = element.nodeName.toLowerCase();
        if (element.parentNode) {
          let sameTagSiblings = Array.from(element.parentNode.children)
              .filter(e => e.nodeName === element.nodeName);
          if (sameTagSiblings.length > 1) {
              selector += ':nth-child(' + (Array.from(element.parentNode.children).indexOf(element) + 1) + ')';
          }
          path.unshift(selector);
          element = element.parentNode;
        } else {
          break
        }
    }
    return path.join(' > ');
}

function recordEvent(event, type) {
  chrome.storage.local.get('recording', (data) => {
    if (data.recording) {
      const element = event.target;
      const elementDetails = {
        host: window.location.href,
        eventType: type,
        tagName: element.tagName,
        id: element.id,
        className: element.getAttribute('class'), // svg.className returns an instance of SVGAnimatedString: https://developer.mozilla.org/en-US/docs/Web/API/Element/className#notes
        name: element.name,
        value: element.value || null,
        innerText: element.innerText,
        href: element.href || null,
        src: element.src || null,
        timeStamp: event.timeStamp,
        inputType: element.type,
        target: generateSelector(element),
        x: element.clientX,
        y: element.clientY,
      };

      chrome.runtime.sendMessage({ action: 'recordEvent', elementDetails });
    }
  })
}

document.addEventListener('click', (event) => {
  recordEvent(event, 'click');
});

document.addEventListener('input', (event) => {
  recordEvent(event, 'input');
});

document.addEventListener('change', (event) => {
  recordEvent(event, 'change');
});