import arg from 'arg'
import readlineSync from 'readline-sync'

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--public-ip': String,
            '--node-ip': String,
            '--subnet': String,
        },
        {
            argv: rawArgs.slice(2),
        }
    )

    return {
        public_ip: args['--public-ip'] || "127.0.0.1",
        nodeIP: args['--nodeIP'] || '127.0.0.1',
        subnetID: args['--subnet']
    }
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args)
    global.public_ip = options.public_ip
    global.nodeIP = options.nodeIP
    global.subnetID = options.subnetID
    global.rpcProvider = `https://${options.nodeIP}/ext/bc/C/rpc`
    global.node_args = { nodeIP: options.nodeIP, subnetID: options.subnetID, password: options.password }

    global.mnemonic = readlineSync.question("Enter mnemonic phrase: ")
    global.publickey = readlineSync.question("Enter public key: ")

    // Use these for testing
    // global.mnemonic = "pistol satoshi case draft prepare valve title goose core security expand perfect"
    // global.publickey = "0x4402a4935e0A5E57b7e585d0b8ecB8DA75141f6b"

    require('./api')
}

