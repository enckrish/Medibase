# Medibase Admin CLI
This acts as a interface between the smart contract and the MedibaseVM. It performs the following functions specifically:

1. Check if PayID is valid and invalidate it once used.
2. Allow validators to register for reward distribution.
3. Provide API call to distribute reward to validators.
4. Provide API call to remove validators once they pass their `endTime`.


## How to use
First we will create a global symlink for faster access
```
cd medibase-admin-cli
npm link
```
Then we can run the CLI by using:
```
medibase-admin-cli --node-ip="127.0.0.1" --subnet="2Km41WLZbcjcEKssgku674vuq2Lb13PjEsgthGtZvbp8PNUJUT" --public-ip="123.4.5.6"
```
```
Args:
node-ip: The IP of avalanchego node to make API calls. By default is set to localhost:9650
subnet: The subnetID that the blockchain is being validated by.
public-ip: Set it to allow non-local machines to interact with the CLI.  
```
This will prompt for the mnemonic of admin address followed by its public key.

The admin address should be the one that was used as admin while deploying the smart contract.
## API 
```
/api/add_validator/:nodeID/cchain/:payAddr
```
Used by VM to register validators for reward distribution.

```
/api/useup_id/:id
```
Used by VM to check ID and invalidate it.

```
/api/pay_validators
```
To be called seperately, to distribute accumulated rewards to validators.

```
/api/refresh_validators
```
To be called seperately, to purge validators from the reward system after they cross their `endTime`.