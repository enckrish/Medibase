# Medibase Virtual Machine

This is a Virtual Machine based on the TimestampVM example from Avalanche docs, see: [Create a Virtual Machine](https://docs.avax.network/build/tutorials/platform/create-a-virtual-machine-vm) with added fee distribution to validators on the validating subnet. 

## How to get started
To build the VM, run the following commands:
```
cd medibasevm
./scripts/build.sh avalanchego-v1.5.2/plugins/
```
The argument is the path to the VM and should be inside avalanchego's plugins directory.

For the next steps, follow the steps at [Create a Custom Blockchain](https://docs.avax.network/build/tutorials/platform/create-custom-blockchain). To be part of the fee distribution, you need to call the `addValidator` API. For more on supported APIs, see below.

MedibaseVM works along the `medibase-admin-cli`. For more info on setting it up, see [here](https://github.com/encKrish/Medibase/blob/master/medibase-admin-cli/README.md). 

## API
Most APIs are same as TimestampVM. The ones new, or modified are listed below:
### medibasevm.proposeBlock
This method is used to propose a block, as the name suggests.
```
{
    "jsonrpc": "2.0",
    "method": "medibasevm.proposeBlock",
    "params":{
        "payID":"45811215987636492305239168533040103403033843947541231359142843447755395066473",
        "cid": "BesboYkzEctXBUxHJAvV1DiWfmzEZaCiZbwtW1hD3MqhyBsX5zbzVQYLudtjzTU8mpLM6qDJDDcH4aUyT5JEQ4zLbC5i2"
    },
    "id": 1
}
```

`cid` should be a CB58-encoded string. `medibasevm.encode` returns a CB58-encoded string. 

`payID` is registered using the `deposit` method of the smart-contract. Passing the C-Chain address to `addrToLatestID` will return the ID once it is registered. `payID` cannot be used more than once. `medibase-admin-cli` verifies that the `payID` is registered and invalidates it after use.

`payID` can be used to filter out desired block after it has been accepted.

### medibasevm.addValidator
Calling this registers the node for reward distributions. This method should be called after a node has become a part of the validating subnet.
```
{
    "jsonrpc": "2.0",
    "method": "medibasevm.addValidator",
    "params":{
        "nodeID":"NodeID-xxxxxxxxxxxxxxxxx",
        "payAddr": "0x4402a4935e0A5E57b7e585d0b8ecB8DA75141f6b"
    },
    "id": 1
}
```

`nodeID` of the node in the validating subnet.

`payAddr` is the C-Chain address where the rewards should be sent.

### medibasevm.setAdminIP
Used to change the IP to access `medibase-admin-cli`. The CLI in this repo listens on `128.0.0.1:3001`, so there is no need to call this if admin's public IP is not set explicitly. This only changes the admin IP for that particular node on which it is called.
```
{
    "jsonrpc": "2.0",
    "method": "medibasevm.setAdminIP",
    "params":{
        "ip":"128.0.0.1",
        "port": "3001"
    },
    "id": 1
}
```
Sets `Admin_IP` to `ip:port`.

## Steps to get PayID using Remix
For the following steps, make sure to select `Injected Web3` as provider and switching network to `Fuji C-Chain` in Metamask.
1. Paste the contract code in this repo in `Remix`.
2. Load contract from `0x959aF3BC31057BC0061e42F1d9cD8690246c1894`
3. Take note of the `fee` and use the value while calling the `deposit` method.
4. Wait for some time for the transaction to get confirmed, then call `addrToLatestID` using your address to get your PayID. If PayID is 0, then wait for some more time.
