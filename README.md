# ilp-frog
Tiny wrapper around Interledger's Ledger Plugin Interface, that exposes Interledger's RPC API

![frog](https://www.globeimports.com/wp-content/uploads/2016/08/26781F.jpg "Five Bells Frog")

This will output Alice's balance in nano-USD, e.g. "206157309414":
```sh
npm install ilp-plugin-bells
DEBUG=* PORT=3010 BELLS_ACCOUNT=https://red.ilpdemo.org/ledger/accounts/alice BELLS_PASSWORD=alice PORT=3010 node fiveBellsFrog.js
sleep 10 # wait for plugin to connect to the ledger
curl -H "Authorization: Basic aHR0cHM6Ly9yZWQuaWxwZGVtby5vcmcvbGVkZ2VyL2FjY291bnRzL2FsaWNlOmFsaWNl" http://localhost:3010/rpc?method=get_balance
```
