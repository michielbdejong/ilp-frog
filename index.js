const http = require('http')
module.exports = (plugin, port) => {
  if (!plugin.getLimit) {
    plugin.getLimit = function() {
      return Promise.resolve(plugin.getInfo().maxBalance)
    }
  }
  http.createServer((req, res) => {
    try {
      let queryPairs = req.url.split('?')[1].split('&')
      let methodParts
      queryPairs.map(pair => {
        if (pair.startsWith('method=')) {
          methodParts = pair.substring('method='.length).split('_')
        }
      })
      // e.g. params is 'method=send_transfer' -> methodParts is ['send', 'transfer'] -> method is 'sendTransfer'
      const method = methodParts[0] + methodParts[1].charAt(0).toUpperCase() + methodParts[1].slice(1)
      let str = ''
      req.on('data', (chunk) => {
        str += chunk
      })
      req.on('end', () => {
        let input = ''
        try {
          if (str.length) {
            input = JSON.parse(str)
          }
        } catch(e) {
          console.error('Unreadable POST body', str, e)
          res.writeHead(400); res.end('Unreadable POST body'); return
        }
        try {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          let promise
          // special-case methods that take array elements as separate arguments:
          if (['reject_incoming_transfer', 'fulfill_condition'].indexOf(method) !== -1) { 
            promise = plugin[method].apply(plugin, input)
          } else {
            promise = plugin[method](input)
          }
          promise.then(output => {
            res.end(JSON.stringify(output))
          })
        } catch(e) {
          console.error('error executing', req.url, method, input, e)
          res.writeHead(500); res.end('Error executing request'); return
        }
      })
    } catch(e) {
      console.error('Unreadable query parameters', req.url, e)
      res.writeHead(400); res.end('Unreadable query parameters'); return
    }
  }).listen(port)
}
