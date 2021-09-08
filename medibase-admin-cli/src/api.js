import express from 'express'
import Web3 from 'web3'
import HDWalletProvider from '@truffle/hdwallet-provider'
import fs from 'fs'
import { validatorExistsIn, refreshValidators } from './node_requests'
import MedibaseABI from './medibase_contract.json'

let rpcProvider = "https://api.avax-test.network/ext/bc/C/rpc"
const CONTRACT_ADDRESS = "0x959aF3BC31057BC0061e42F1d9cD8690246c1894"

const provider = new HDWalletProvider({
    mnemonic: mnemonic,
    providerOrUrl: rpcProvider
})
const web3 = new Web3(provider)
console.log("Connected to RPC Provider:", rpcProvider)

let contract = new web3.eth.Contract(MedibaseABI, CONTRACT_ADDRESS)

const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3001

app.listen(PORT, public_ip, () => {
    console.log(`medibase-admin-cli listening on  ${public_ip}:${PORT}`)
})

app.get('/', (req, res) => {
    res.send("medibase-admin-cli API server")
})

app.get('/api/add_validator/:nodeID/cchain/:payAddr', async function (req, res) {
    let nodeID = req.params.nodeID;
    let payAddr = req.params.payAddr;
    let args = { ...node_args, nodeID: nodeID, payAddr: payAddr }

    console.log(`Checking if ${nodeID} is a valid validator...`)
    validatorExistsIn(args, async (isValid) => {
        if (isValid) {
            console.log("Adding validator...")
            let added = await contract.methods.isValidatorAdded(nodeID).call()
            if (!added) {
                try {
                    let nonce = await web3.eth.getTransactionCount(publickey)
                    await contract.methods.addValidator(nodeID, payAddr).send({ from: publickey })
                } catch (err) { console.log(err) }
                console.log("Validator successfully added.")
                res.send({
                    'success': true
                });
            } else {
                console.log("Validator already registered!")
                res.send({ 'success': false });
            }
        }
        else {
            console.log("Validator is not a part of the subnet!")
            res.send({ 'success': false });
        }
    })
})

app.get('/api/useup_id/:id', async function (req, res) {
    let ID = req.params.id;
    console.log(`Using up ID: ${ID}...`)
    let payIDAddr = await contract.methods.payIDtoAddr(ID).call()
    if (payIDAddr == '0x0000000000000000000000000000000000000000') {
        console.log("ID was not registered!")
        res.send({ 'success': false });
    } else {
        try {
            let nonce = await web3.eth.getTransactionCount(publickey)
            await contract.methods.invalidateID(ID).send({ from: publickey, nonce: nonce })
        } catch (err) { console.log(err) }
        console.log("Successfully invalidated ID.")
        res.send({
            'success': true
        });
    }
})

app.get('/api/pay_validators', async function (req, res) {
    console.log("Request made to pay validators...")
    web3.eth.getBalance(CONTRACT_ADDRESS, (err, bal) => {
        if (err)
            console.log("Couldn't fetch contract's balance")
        else {
            console.log("Contract's balance stands at:", bal)
            if (bal == 0) {
                console.log("Couldn't distribute zero funds!")
                res.send({
                    'success': false
                });
            } else {
                web3.eth.getBalance(publickey, async (err, bal) => {
                    if (err) {
                        console.log("Couldn't fetch balance:", err)
                        res.send({
                            'success': false
                        });
                    } else {
                        console.log("Admin address balance is currently at", bal)
                        try {
                            let nonce = await web3.eth.getTransactionCount(publickey)
                            await contract.methods.payValidators().send({ from: publickey, nonce: nonce })
                            console.log("Validators paid successfully.")
                            web3.eth.getBalance(publickey, (err, bal) => {
                                if (err)
                                    console.log("Couldn't fetch new balance:", err)
                                else console.log("New balance is: ", bal)
                            })
                            res.send({
                                'success': true
                            });
                        } catch (err) {
                            console.log(err)
                            res.send({
                                'success': false
                            });
                        }
                    }
                })
            }
        }
    })
})

app.get('/api/refresh_validators', async function (req, res) {
    try {
        refreshValidators(deleteValidator)
        res.send({ success: true })
    } catch (err) {
        console.log(err)
        res.send({ success: false })
    }
})

async function deleteValidator(nodeID) {
    let nonce = await web3.eth.getTransactionCount(publickey)
    await contract.methods.payValidators().send({ from: publickey, nonce: nonce })
    console.log(`Successfully removed ${nodeID}`)
}