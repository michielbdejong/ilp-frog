const PluginBells = require('ilp-plugin-bells')
const Frog = require('./index.js')
plugin = new PluginBells({
  account: process.env.BELLS_ACCOUNT,
  password: process.env.BELLS_PASSWORD
})

console.log('connecting plugin, please wait...')
const correctAuthHeader = 'Basic ' + new Buffer(process.env.BELLS_ACCOUNT + ':' + process.env.BELLS_PASSWORD).toString('base64')

plugin.connect().then(() => {
  console.log('plugin connected to the ledger')
  Frog(plugin, process.env.PORT, (req) => {
    console.log('request headers', req.headers)
    return (req.headers.authorization.trim() === correctAuthHeader)
  })
  console.log(`frog listening for rpc requests; try e.g. curl -H "Authorization: ${correctAuthHeader}" http://localhost:3010/rpc?method=get_balance`)
})
