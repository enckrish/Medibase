import { http } from 'follow-redirects'
import fs from 'fs'

export const callPChainAPI = (args, callback) => {
    // args need: nodeIP, method, params
    let response;

    let options = {
        'method': 'POST',
        'hostname': args.nodeIP,
        'port': 9650,
        'path': '/ext/bc/P',
        'headers': {
            'Content-Type': 'application/json'
        },
        'maxRedirects': 20
    };

    let req = http.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function (chunk) {
            var body = Buffer.concat(chunks);
            callback(body.toString())
        });

        res.on("error", function (error) {
            res = error
            callback(error);
        });
    });

    let postData = JSON.stringify({
        "jsonrpc": "2.0",
        "method": `platform.${args.method}`,
        "params": args.params,
        "id": 1
    });

    req.write(postData);

    req.end();
}

export function validatorExistsIn(args, callback) {
    // args need nodeIP, nodeID, subnetID
    console.log(`Checking if NodeID: ${args.nodeID} is validator for subnet: ${args.subnetID}...`)
    callPChainAPI({ ...args, method: 'getCurrentValidators', params: { subnetID: args.subnetID } }, (response) => {
        let isValidator = response.includes(args.nodeID)
        console.log(isValidator)
        callback(isValidator)
    })
}

export function refreshValidators(deleteFn) {
    // get current date and convert to big number
    console.log("Searching for validators past their respective endTimes...")
    let currTime = Date.now()
    callPChainAPI({ method: 'getCurrentValidators', params: { subnetID: subnetID } }, response => {
        let vdrList = JSON.parse(response).result.validators
        for (let i = 0; i < vdrList.length; i++) {
            let vdr = vdrList[i]
            let endTime = parseInt(vdr.endTime) * 1000
            let nodeID = vdr.nodeID
            if (currTime >= endTime) {
                console.log(`${nodeID}'s endTime: ${endTime} is less than the current time: ${Date.now()}.`)
                console.log(`Removing ${nodeID}...`)
                deleteFn(nodeID)
            } else
                console.log(`${nodeID}'s endTime: ${endTime} is more than the current time: ${Date.now()}.`)
        }
        console.log("Validator check finished.")
    })
}