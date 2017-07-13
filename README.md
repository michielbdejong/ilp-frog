# ilp-frog
Tiny wrapper around Interledger's Ledger Plugin Interface, that exposes Interledger's RPC API

![frog](https://cdn.pixabay.com/photo/2015/09/06/20/31/frog-927765_640.jpg "https://pixabay.com/p-927765")

This will output Alice's balance in nano-USD, e.g. "206157309414":
```sh
npm install ilp-plugin-bells
DEBUG=* node example.js &
sleep 10 # wait for plugin to connect to the ledger
curl http://localhost:3010/rpc?method=get_balance
```
