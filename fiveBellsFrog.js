// export BELLS_ACCOUNT=https://red.ilpdemo.org/ledger/accounts/alice
// export BELLS_PASSWORD=alice
// export OTHER_ACCOUNT=us.usd.red. bob
// export PORT=6001

const PluginBells = require('ilp-plugin-bells')
const Frog = require('./index.js')
plugin = new PluginBells({
  account: process.env.BELLS_ACCOUNT,
  password: process.env.BELLS_PASSWORD
})

console.log('connecting plugin, please wait...')
const correctAuthHeader = 'Basic ' + new Buffer(process.env.BELLS_ACCOUNT + ':' + process.env.BELLS_PASSWORD).toString('base64')

plugin.connect().then(() => {
  return plugin.getInfo()
}).then(ledgerInfo => {
  console.log('plugin connected to the ledger')
  Frog(plugin, process.env.PORT, (req) => {
    console.log('request headers', req.headers)
    return (req.headers.authorization.trim() === correctAuthHeader)
  }, {
    ledger: ledgerInfo.prefix,
    from: process.env.BELLS_ACCOUNT.split('.').reverse()[0],
    to: process.env.OTHER_ACCOUNT
  }, process.env.PEER_ILP_SECRET)
  console.log(`frog listening for rpc requests; ilp_secret:v0.1:`
      + Buffer.from('http://peer.ledger.:localtoken@localhost:' + process.env.PORT + '/rpc', 'ascii').toString('base64').replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, ''),
      `try e.g. curl -H "Authorization: ${correctAuthHeader}" http://localhost:${process.env.PORT}/rpc?method=get_balance`)
})
