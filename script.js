const parse = require('gemini-to-html/parse')
const render = require('gemini-to-html/render')
if (location.href.startsWith('gemini')) {
  fetch(location.href).then(response => response.text().then(text => {
    document.write(render(parse(text)))
  }))
}