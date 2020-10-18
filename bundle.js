(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

const htmlEscape = string => string
	.replace(/&/g, '&amp;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;');

const htmlUnescape = htmlString => htmlString
	.replace(/&gt;/g, '>')
	.replace(/&lt;/g, '<')
	.replace(/&#0?39;/g, '\'')
	.replace(/&quot;/g, '"')
	.replace(/&amp;/g, '&');

exports.htmlEscape = (strings, ...values) => {
	if (typeof strings === 'string') {
		return htmlEscape(strings);
	}

	let output = strings[0];
	for (const [index, value] of values.entries()) {
		output = output + htmlEscape(String(value)) + strings[index + 1];
	}

	return output;
};

exports.htmlUnescape = (strings, ...values) => {
	if (typeof strings === 'string') {
		return htmlUnescape(strings);
	}

	let output = strings[0];
	for (const [index, value] of values.entries()) {
		output = output + htmlUnescape(String(value)) + strings[index + 1];
	}

	return output;
};

},{}],2:[function(require,module,exports){
const HEADER = /^(#+)\s+(.*)/
const PRE = /^```(.*)?/
const LIST = /^\*\s+(.*)/
const QUOTE = /^>\s+(.*)/
const LINK = /^=>\s+(\S+)\s*(.*)/

module.exports = parse

function parse (text) {
  const lines = text.split(/\r?\n/)

  const tokens = []

  let index = 0

  function current () {
    return lines[index]
  }

  while (index < lines.length) {
    const line = current()
    let match = null
    if (match = line.match(HEADER)) {
      const [_, levels, content] = match

      tokens.push({ type: 'header', level: levels.length, content })
    } else if (match = line.match(PRE)) {
      const [_, alt] = match
      const items = []
      index++

      while (index < lines.length) {
        const item = current()
        if (current().match(PRE)) break
        items.push(item)
        index++
      }

      tokens.push({ type: 'pre', items, alt })
    } else if (match = line.match(LIST)) {
      const items = []

      while (index < lines.length) {
        const match = current().match(LIST)
        if (!match) break
        const [_, item] = match
        items.push(item)
        index++
      }

      // Go back since we went to far
      index--

      tokens.push({ type: 'list', items })
    } else if (match = line.match(QUOTE)) {
      const [_, content] = match

      tokens.push({ type: 'quote', content })
    } else if (match = line.match(LINK)) {
      const [_, href, rawContent] = match
      const content = rawContent || href

      tokens.push({ type: 'link', content, href })
    } else {
      tokens.push({ type: 'text', content: line })
    }

    index++
  }

  return tokens
}

},{}],3:[function(require,module,exports){
const { htmlEscape } = require('escape-goat')

module.exports = render

function render (tokens) {
  return tokens.map((line) => {
    const { type } = line

    switch (type) {
      case 'quote': return htmlEscape`<blockquote>${line.content}</blockquote>`
      case 'header': return htmlEscape`<h${line.level}>${line.content}</h${line.level}>`
      case 'link': return htmlEscape`<div><a href="${line.href}">${line.content}</a></div>`
      case 'pre': return line.alt
        ? htmlEscape`<pre><code class="language-${line.alt}">\n${line.items.join('\n')}\n</code></pre>`
        : htmlEscape`<pre>\n${line.items.join('\n')}\n</pre>`
      case 'list': return `<ul>\n${line.items.map((item) => htmlEscape`\t<li>${item}</li>`).join('\n')}\n</ul>`
      default: return line.content ? htmlEscape`<p>${line.content}</p>` : '<br/>'
    }
  }).join('\n')
}

},{"escape-goat":1}],4:[function(require,module,exports){
const parse = require('gemini-to-html/parse')
const render = require('gemini-to-html/render')

if (document.body.children.length === 1 &&
document.getElementsByTagName('pre')[0] !== undefined) {
  fetch(location.href).then(response => {
    if (response.headers.get('Content-Type') === 'text/gemini') {
      response.text().then(text => {
        let parsed = parse(text)
        let rendered = render(parsed)

        let title = parsed.find(element => element.type === 'header').content || 'Gemini Document' // Find relevant page content here?

        document.write(`
          <!DOCTYPE html>
          <title>${title}</title>
          <meta charset="utf-8"/>
          <meta http-equiv="Content-Type" content="text/html charset=utf-8"/>
          <link rel="stylesheet" href="agregore://theme/style.css"/>
          <link rel="stylesheet" href="agregore://theme/highlight.css"/>
          ${rendered}
          <script src="agregore://theme/highlight.js"></script>
          <script>
            if(window.hljs) hljs.initHighlightingOnLoad()

            const toAnchor = document.querySelectorAll('h1[id],h2[id],h3[id],h4[id]')
            console.log('Anchoring', toAnchor)

            for(let element of toAnchor) {
              const anchor = document.createElement('a')
              anchor.setAttribute('href', '#' + element.id)
              anchor.setAttribute('class', 'agregore-header-anchor')
              anchor.innerHTML = element.innerHTML
              element.innerHTML = anchor.outerHTML
            }

            const INDENT_HEADINGS = [
              'H1',
              'H2',
              'H3'
            ]
            var currentDepth = 0
            Array.from(document.body.children).forEach(element => {
              if (INDENT_HEADINGS.includes(element.tagName)) {
                currentDepth = element.tagName.slice(-1)
                element.classList.add('agregore-depth' + (currentDepth - 1))
              } else element.classList.add('agregore-depth' + (currentDepth))
            })
          </script>
        `)
      })
    }
  })
}

},{"gemini-to-html/parse":2,"gemini-to-html/render":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXNjYXBlLWdvYXQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2VtaW5pLXRvLWh0bWwvcGFyc2UuanMiLCJub2RlX21vZHVsZXMvZ2VtaW5pLXRvLWh0bWwvcmVuZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBodG1sRXNjYXBlID0gc3RyaW5nID0+IHN0cmluZ1xuXHQucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuXHQucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG5cdC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG5cdC5yZXBsYWNlKC88L2csICcmbHQ7Jylcblx0LnJlcGxhY2UoLz4vZywgJyZndDsnKTtcblxuY29uc3QgaHRtbFVuZXNjYXBlID0gaHRtbFN0cmluZyA9PiBodG1sU3RyaW5nXG5cdC5yZXBsYWNlKC8mZ3Q7L2csICc+Jylcblx0LnJlcGxhY2UoLyZsdDsvZywgJzwnKVxuXHQucmVwbGFjZSgvJiMwPzM5Oy9nLCAnXFwnJylcblx0LnJlcGxhY2UoLyZxdW90Oy9nLCAnXCInKVxuXHQucmVwbGFjZSgvJmFtcDsvZywgJyYnKTtcblxuZXhwb3J0cy5odG1sRXNjYXBlID0gKHN0cmluZ3MsIC4uLnZhbHVlcykgPT4ge1xuXHRpZiAodHlwZW9mIHN0cmluZ3MgPT09ICdzdHJpbmcnKSB7XG5cdFx0cmV0dXJuIGh0bWxFc2NhcGUoc3RyaW5ncyk7XG5cdH1cblxuXHRsZXQgb3V0cHV0ID0gc3RyaW5nc1swXTtcblx0Zm9yIChjb25zdCBbaW5kZXgsIHZhbHVlXSBvZiB2YWx1ZXMuZW50cmllcygpKSB7XG5cdFx0b3V0cHV0ID0gb3V0cHV0ICsgaHRtbEVzY2FwZShTdHJpbmcodmFsdWUpKSArIHN0cmluZ3NbaW5kZXggKyAxXTtcblx0fVxuXG5cdHJldHVybiBvdXRwdXQ7XG59O1xuXG5leHBvcnRzLmh0bWxVbmVzY2FwZSA9IChzdHJpbmdzLCAuLi52YWx1ZXMpID0+IHtcblx0aWYgKHR5cGVvZiBzdHJpbmdzID09PSAnc3RyaW5nJykge1xuXHRcdHJldHVybiBodG1sVW5lc2NhcGUoc3RyaW5ncyk7XG5cdH1cblxuXHRsZXQgb3V0cHV0ID0gc3RyaW5nc1swXTtcblx0Zm9yIChjb25zdCBbaW5kZXgsIHZhbHVlXSBvZiB2YWx1ZXMuZW50cmllcygpKSB7XG5cdFx0b3V0cHV0ID0gb3V0cHV0ICsgaHRtbFVuZXNjYXBlKFN0cmluZyh2YWx1ZSkpICsgc3RyaW5nc1tpbmRleCArIDFdO1xuXHR9XG5cblx0cmV0dXJuIG91dHB1dDtcbn07XG4iLCJjb25zdCBIRUFERVIgPSAvXigjKylcXHMrKC4qKS9cbmNvbnN0IFBSRSA9IC9eYGBgKC4qKT8vXG5jb25zdCBMSVNUID0gL15cXCpcXHMrKC4qKS9cbmNvbnN0IFFVT1RFID0gL14+XFxzKyguKikvXG5jb25zdCBMSU5LID0gL149PlxccysoXFxTKylcXHMqKC4qKS9cblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZVxuXG5mdW5jdGlvbiBwYXJzZSAodGV4dCkge1xuICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoL1xccj9cXG4vKVxuXG4gIGNvbnN0IHRva2VucyA9IFtdXG5cbiAgbGV0IGluZGV4ID0gMFxuXG4gIGZ1bmN0aW9uIGN1cnJlbnQgKCkge1xuICAgIHJldHVybiBsaW5lc1tpbmRleF1cbiAgfVxuXG4gIHdoaWxlIChpbmRleCA8IGxpbmVzLmxlbmd0aCkge1xuICAgIGNvbnN0IGxpbmUgPSBjdXJyZW50KClcbiAgICBsZXQgbWF0Y2ggPSBudWxsXG4gICAgaWYgKG1hdGNoID0gbGluZS5tYXRjaChIRUFERVIpKSB7XG4gICAgICBjb25zdCBbXywgbGV2ZWxzLCBjb250ZW50XSA9IG1hdGNoXG5cbiAgICAgIHRva2Vucy5wdXNoKHsgdHlwZTogJ2hlYWRlcicsIGxldmVsOiBsZXZlbHMubGVuZ3RoLCBjb250ZW50IH0pXG4gICAgfSBlbHNlIGlmIChtYXRjaCA9IGxpbmUubWF0Y2goUFJFKSkge1xuICAgICAgY29uc3QgW18sIGFsdF0gPSBtYXRjaFxuICAgICAgY29uc3QgaXRlbXMgPSBbXVxuICAgICAgaW5kZXgrK1xuXG4gICAgICB3aGlsZSAoaW5kZXggPCBsaW5lcy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IGN1cnJlbnQoKVxuICAgICAgICBpZiAoY3VycmVudCgpLm1hdGNoKFBSRSkpIGJyZWFrXG4gICAgICAgIGl0ZW1zLnB1c2goaXRlbSlcbiAgICAgICAgaW5kZXgrK1xuICAgICAgfVxuXG4gICAgICB0b2tlbnMucHVzaCh7IHR5cGU6ICdwcmUnLCBpdGVtcywgYWx0IH0pXG4gICAgfSBlbHNlIGlmIChtYXRjaCA9IGxpbmUubWF0Y2goTElTVCkpIHtcbiAgICAgIGNvbnN0IGl0ZW1zID0gW11cblxuICAgICAgd2hpbGUgKGluZGV4IDwgbGluZXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gY3VycmVudCgpLm1hdGNoKExJU1QpXG4gICAgICAgIGlmICghbWF0Y2gpIGJyZWFrXG4gICAgICAgIGNvbnN0IFtfLCBpdGVtXSA9IG1hdGNoXG4gICAgICAgIGl0ZW1zLnB1c2goaXRlbSlcbiAgICAgICAgaW5kZXgrK1xuICAgICAgfVxuXG4gICAgICAvLyBHbyBiYWNrIHNpbmNlIHdlIHdlbnQgdG8gZmFyXG4gICAgICBpbmRleC0tXG5cbiAgICAgIHRva2Vucy5wdXNoKHsgdHlwZTogJ2xpc3QnLCBpdGVtcyB9KVxuICAgIH0gZWxzZSBpZiAobWF0Y2ggPSBsaW5lLm1hdGNoKFFVT1RFKSkge1xuICAgICAgY29uc3QgW18sIGNvbnRlbnRdID0gbWF0Y2hcblxuICAgICAgdG9rZW5zLnB1c2goeyB0eXBlOiAncXVvdGUnLCBjb250ZW50IH0pXG4gICAgfSBlbHNlIGlmIChtYXRjaCA9IGxpbmUubWF0Y2goTElOSykpIHtcbiAgICAgIGNvbnN0IFtfLCBocmVmLCByYXdDb250ZW50XSA9IG1hdGNoXG4gICAgICBjb25zdCBjb250ZW50ID0gcmF3Q29udGVudCB8fCBocmVmXG5cbiAgICAgIHRva2Vucy5wdXNoKHsgdHlwZTogJ2xpbmsnLCBjb250ZW50LCBocmVmIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRva2Vucy5wdXNoKHsgdHlwZTogJ3RleHQnLCBjb250ZW50OiBsaW5lIH0pXG4gICAgfVxuXG4gICAgaW5kZXgrK1xuICB9XG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuIiwiY29uc3QgeyBodG1sRXNjYXBlIH0gPSByZXF1aXJlKCdlc2NhcGUtZ29hdCcpXG5cbm1vZHVsZS5leHBvcnRzID0gcmVuZGVyXG5cbmZ1bmN0aW9uIHJlbmRlciAodG9rZW5zKSB7XG4gIHJldHVybiB0b2tlbnMubWFwKChsaW5lKSA9PiB7XG4gICAgY29uc3QgeyB0eXBlIH0gPSBsaW5lXG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ3F1b3RlJzogcmV0dXJuIGh0bWxFc2NhcGVgPGJsb2NrcXVvdGU+JHtsaW5lLmNvbnRlbnR9PC9ibG9ja3F1b3RlPmBcbiAgICAgIGNhc2UgJ2hlYWRlcic6IHJldHVybiBodG1sRXNjYXBlYDxoJHtsaW5lLmxldmVsfT4ke2xpbmUuY29udGVudH08L2gke2xpbmUubGV2ZWx9PmBcbiAgICAgIGNhc2UgJ2xpbmsnOiByZXR1cm4gaHRtbEVzY2FwZWA8ZGl2PjxhIGhyZWY9XCIke2xpbmUuaHJlZn1cIj4ke2xpbmUuY29udGVudH08L2E+PC9kaXY+YFxuICAgICAgY2FzZSAncHJlJzogcmV0dXJuIGxpbmUuYWx0XG4gICAgICAgID8gaHRtbEVzY2FwZWA8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtJHtsaW5lLmFsdH1cIj5cXG4ke2xpbmUuaXRlbXMuam9pbignXFxuJyl9XFxuPC9jb2RlPjwvcHJlPmBcbiAgICAgICAgOiBodG1sRXNjYXBlYDxwcmU+XFxuJHtsaW5lLml0ZW1zLmpvaW4oJ1xcbicpfVxcbjwvcHJlPmBcbiAgICAgIGNhc2UgJ2xpc3QnOiByZXR1cm4gYDx1bD5cXG4ke2xpbmUuaXRlbXMubWFwKChpdGVtKSA9PiBodG1sRXNjYXBlYFxcdDxsaT4ke2l0ZW19PC9saT5gKS5qb2luKCdcXG4nKX1cXG48L3VsPmBcbiAgICAgIGRlZmF1bHQ6IHJldHVybiBsaW5lLmNvbnRlbnQgPyBodG1sRXNjYXBlYDxwPiR7bGluZS5jb250ZW50fTwvcD5gIDogJzxici8+J1xuICAgIH1cbiAgfSkuam9pbignXFxuJylcbn1cbiJdfQ==
