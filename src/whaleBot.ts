import {Program} from '@project-serum/anchor';
import {Connection, PublicKey, SYSVAR_RENT_PUBKEY, Transaction} from '@solana/web3.js';
import BN from 'bn.js';
import {
    Cluster,
    Margin,
    MarginsCluster,
    MarketInfo,
    sleep,
    USDC_DECIMALS,
    USDC_DEVNET_MINT_ADDRESS,
    USDC_MAINNET_MINT_ADDRESS,
    Zo,
    ZO_DEX_DEVNET_PROGRAM_ID,
    ZO_DEX_MAINNET_PROGRAM_ID,
    ZO_FUTURE_TAKER_FEE,
    ZO_OPTION_TAKER_FEE,
    ZO_SQUARE_TAKER_FEE,
    ZoMarket
} from '@zero_one/client'
import {
    WHALE_THRESHOLD, 
    SLEEP_DURATION
} from './config'
import bunyan from 'bunyan'

const log = bunyan.createLogger({name: 'whale-bot'});

export default class WhaleBot {

    constructor(private readonly cluster: Cluster, private readonly connection: Connection) {
    }

    private startTimestamp = Date.now();
    private botActive = true;

    private async scanOrderbook() {
        console.log(this.startTimestamp);
        await sleep(5000);
    }

    async start() {
        while(this.botActive) {
            log.info('[scanning orderbook]');
            await this.scanOrderbook();
            log.info('[sleeping]');
            await sleep(SLEEP_DURATION);
        }
    }

    // async launch() {
    //     log.info('[loading liquidator]');
    //     this.marginsCluster = new MarginsCluster(this.program, this.cluster);
    //     await this.marginsCluster.launch()
    //     log.info('[loaded margins cluster]');
    //     this.liquidatorMarginKey = (await Margin.getMarginKey(this.state, this.program.provider.wallet.publicKey, this.program))[0].toString();
    //     this.swapper = new Swapper(this.state, this.program, this.liquidatorMargin);
    //     this.listen();
    //     log.info('[started liquidation cycle]');
    //     this.findLiquidatableAccountsAndLiquidate();
    //     await this.liquidationCycle();
    // }

}