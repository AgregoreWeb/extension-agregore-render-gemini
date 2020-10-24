/* global location, fetch */
const parse = require('gemini-to-html/parse')
const render = require('gemini-to-html/render')

if (document.querySelector("body>pre[style='word-wrap: break-word; white-space: pre-wrap;']") !== undefined) {
  fetch(location.href).then(response => {
    if (response.headers.get('Content-Type') === 'text/gemini') {
      response.text().then(text => {
        const parsed = parse(text)
        const rendered = render(parsed)

        const title = (parsed.find(({ type }) => type === 'header') || { content: location.href }).content

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
