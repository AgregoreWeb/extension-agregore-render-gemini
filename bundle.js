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
/* global location, fetch */
const parse = require('gemini-to-html/parse')
const render = require('gemini-to-html/render')

if (document.querySelector("body>pre[style='word-wrap: break-word; white-space: pre-wrap;']") !== undefined) {
  fetch(location.href).then(response => {
    if (response.headers.get('Content-Type') === 'text/gemini') {
      response.text().then(text => {
        const parsed = parse(text)
        const rendered = render(parsed)

        const title = (parsed.find(({ type }) => type === 'header') || {content: location.href}).content

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

},{"gemini-to-html/parse":2,"gemini-to-html/render":3}]},{},[4]);
