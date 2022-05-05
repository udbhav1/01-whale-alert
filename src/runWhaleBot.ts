import {Connection, Keypair, PublicKey, Transaction} from '@solana/web3.js';
import {bs58} from '@project-serum/anchor/dist/cjs/utils/bytes';
import {Provider} from '@project-serum/anchor';
import {createProgram} from '@zero_one/client'
import WhaleBot from './whaleBot';
import {PRIVATE_KEY} from './private';
import {CLUSTER, RPC_ENDPOINT} from './config';
import bunyan from 'bunyan';

const log = bunyan.createLogger({name: "whale-alert-wrapper"});

async function run() {
    try {
        log.info('*** WHALE ALERT BOT STARTED ***');
        const keyPair = Keypair.fromSecretKey(
            bs58.decode(
                PRIVATE_KEY
            )
        );
        const WALLET = {
            // @ts-ignore
            payer: keyPair,
            signTransaction: async (tx: Transaction) => {
                await tx.sign(keyPair);
                return tx;
            },
            signAllTransactions: async (txs: Transaction[]) => {
                for (const tx of txs) await tx.sign(keyPair);
                return txs;
            },
            publicKey: new PublicKey(keyPair.publicKey)
        };

        const provider = new Provider(
            new Connection(
                RPC_ENDPOINT,
                'recent'
            ),
            WALLET,
            {
                skipPreflight: true,
                preflightCommitment: 'recent',
                commitment: 'recent'
            }
        );
        const program = createProgram(provider, CLUSTER);
        const whaleBot = new WhaleBot(CLUSTER, program);
        await whaleBot.loop();
    } catch (err) {
        log.error('*** WHALE ALERT BOT FAILED ***');
        log.error(err);
        log.error('*** WHALE ALERT BOT RESTARTING ***');
        run().then();
    }
}

log.info('*** Starting Whale Alert Bot ***');
run().then();