const http = require('http')

       /********************************************************/
      /* ILP-FROG: simple connector around an LPI plugin      */
     /*                                                      */
    /*  For most functions, it calls the same method on the */
   /*   next hop. For some, it slightly translates the it  */
  /*    using the transformArgs callback.                 */
 /*    It also calls back when events are triggered.     */
/********************************************************/

module.exports = (plugin, port, checkAuth, ledgerArgs, ilpSecret) => {
  const peerCaps = Buffer.from(ilpSecret.substring('ilp_secret:v0.1:'.length), 'base64').toString('ascii')
  console.log('decoding peer caps', ilpSecret)
  const [ /* 'PROTOCOL://LEDGER:TOKEN@HOST/PATH */, protocol, ledgerPrefix, token, hostname, rpcPath ] = peerCaps.match(/(http[s]{0,1}):\/\/(.*):(.*)\@(.*)\/(.*)/i)
  const uriBase = protocol + '://' + hostname + '/' + rpcPath + '?prefix=' + ledgerPrefix + '&method=',

  plugin.registerRequestHandler((message) => {
    return fetch(uriBase + 'send_request', {
      headers: {
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(Object.assign(message, {
        from: ledgerPrefix + 'me',
        to: ledgerPrefix + 'you',
        ledger: ledgerPrefix
      }))
    }).then(response => {
      return transformArgs(Object.assign(response, ledgerArgs))
    })
  })
  plugin.on('incoming_prepare', (transfer) => {
    return fetch(uriBase + 'send_transfer', {
      headers: {
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(Object.assign(transfer, {
        from: ledgerPrefix + 'me',
        to: ledgerPrefix + 'you',
        ledger: ledgerPrefix
      }))
    })
  })
  function registerFinalizer(lpiName, rpcName) {
    plugin.on(lpiName, (transfer, extra) => {
      return fetch(uriBase + rpcName, {
        headers: {
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify([ transfer.id, extra ])
      })
    })
  }
  registerFinalizer('outgoing_fulfill', 'fulfill_transfer')
  registerFinalizer('outgoing_reject', 'reject_incoming_transfer')
  registerFinalizer('outgoing_cancel', 'expire_transfer')

  if (!plugin.getLimit) {
    plugin.getLimit = function() {
      return Promise.resolve(plugin.getInfo().maxBalance)
    }
  }
  http.createServer((req, res) => {
    if (!checkAuth(req)) {
      res.writeHead(403); res.end('Auth check failed'); return
    }

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
          } else if (['send_transfer', 'send_request'].indexOf(method) !== -1) {
            // note that the frog's min message window is zero, so be careful with that
            promise = plugin[method](Object.assign(input, ledgerArgs)
          } else {
            promise = plugin[method](input)
          }
          promise.then(output => {
            // console.log('Frog executed plugin method:', { method, input, output })
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
