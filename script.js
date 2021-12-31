/* global location */
if (document.contentType.includes('text/gemini')) {
// Only actually load the code if we're in gemini
// This should improve load times a bit
// TODO: Dynamically load the gemini code
  const parse = require('gemini-to-html/parse')
  const render = require('gemini-to-html/render')
  // Might only work on Chromium
  const text = document.querySelector('pre').innerText
  const parsed = parse(text)
  const rendered = render(parsed)

  const firstHeader = parsed.find(({ type }) => type === 'header')
  const title = firstHeader?.content || location.href

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
</script>`)
}
