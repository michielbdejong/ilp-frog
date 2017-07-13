const PluginBells = require('ilp-plugin-bells')
const Frog = require('./index.js')
plugin = new PluginBells({
  account: 'https://red.ilpdemo.org/ledger/accounts/alice',
  password: 'alice'
})
console.log('connecting plugin, please wait...')
plugin.connect().then(() => {
  console.log('plugin connected to the ledger')
  Frog(plugin, 3010)
  console.log('frog listening for rpc requests; try e.g. http://localhost:3010/rpc?method=get_balance')
})
