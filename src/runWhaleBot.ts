import {Connection, Keypair, PublicKey, Transaction} from '@solana/web3.js';
import {bs58} from '@project-serum/anchor/dist/cjs/utils/bytes';
import {Provider} from '@project-serum/anchor';
import {createProgram} from '@zero_one/client'
import WhaleBot from './whaleBot';
import {CLUSTER, RPC_ENDPOINT} from './config'
import bunyan from 'bunyan'

const log = bunyan.createLogger({name: "whale-alert-wrapper"});

async function run() {
    try {
        log.info('*** WHALE ALERT BOT STARTED ***');
        const connection = new Connection(RPC_ENDPOINT);
        const whaleBot = new WhaleBot(CLUSTER, connection);
        await whaleBot.start();
    } catch (err) {
        log.error('*** WHALE ALERT BOT FAILED ***');
        log.error(err);
        log.error('*** WHALE ALERT BOT RESTARTING ***');
        run().then();
    }
}

log.info('*** Starting Whale Alert Bot ***');
run().then();