import {Program} from '@project-serum/anchor';
import {PublicKey} from '@solana/web3.js';
import {
    sleep,
    Cluster,
    State,
    Zo,
    ZO_MAINNET_STATE_KEY,
    ZoMarket,
    Control,
} from "@zero_one/client";
import {
    WHALE_THRESHOLD, 
    SLEEP_DURATION
} from './config';
import {
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS,
    TWITTER_ACCESS_SECRET,
} from './private';
import bunyan from 'bunyan';

const log = bunyan.createLogger({name: 'whale-bot'});

var Twit = require('twit');

const T = new Twit({
    consumer_key: TWITTER_API_KEY,
    consumer_secret: TWITTER_API_SECRET,
    access_token: TWITTER_ACCESS,
    access_token_secret: TWITTER_ACCESS_SECRET,
})

export default class WhaleBot {

    private shouldTweet: boolean = true;

    constructor(private readonly cluster: Cluster, private readonly program: Program<Zo>) {
    }

    private botActive: boolean = true;
    private state: State;
    private perpSymbols: string[] = [];
    private perpMarkets: ZoMarket[] = [];
    private perpOrdersSeen: Set<string> = new Set();
    private seen: number = 0; // fills in the queue (events stick around for a while in the queue)
    private valid: number = 0; // new market orders processed this loop iter

    private async tweet(side, size, symbol, spent, price, key, control) {
        let spentRound = spent.toFixed(2);
        let content = `🚨🚨 WHALE SPOTTED 🚨🚨\n${side} ${size} #${symbol} ($${spentRound}) at $${price}\nsolscan.io/address/${key}`;
        T.post('statuses/update', { status: content }, function(err, data, response) {
            if(err != undefined){
                log.error(err);
            }
        })
    }

    private async parseEvent(event, symbol) {
        this.seen += 1;
        if(!this.perpOrdersSeen.has(event["orderId"].toString()) && !event["eventFlags"]["maker"]) {
            this.valid += 1;
            let amt = (event["side"] == "buy") ? event["nativeQuantityPaid"] : event["nativeQuantityReleased"];
            let usd = amt/(10**6); // pretty sure this works for all markets but not certain
            let side = (event["side"] == "buy") ? "Bought" : "Sold";
            let control = event["control"].toBase58();
            let controlKey = new PublicKey(control);
            let controlAcc = await Control.load(this.program, controlKey);
            let whaleKey = controlAcc.data.authority.toBase58()

            this.perpOrdersSeen.add(event["orderId"].toString());
            if(usd > WHALE_THRESHOLD) {
                log.info(`Whale spotted: ${side} ${event["size"]} ${symbol} for $${usd} at $${event["price"]}, user key: ${whaleKey}`);
                if(this.shouldTweet) {
                    this.tweet(side, event["size"], symbol, usd, event["price"], whaleKey, control);
                }
            }

        }
    }

    private async getFills(market, symbol) {
        // let events = await market.loadEventQueue(this.program.provider.connection);
        let events = await market.loadFills(this.program.provider.connection);
        for(let event of events){
            await this.parseEvent(event, symbol);
        }
    }

    async loop() {
        this.state = await State.load(this.program, ZO_MAINNET_STATE_KEY);
        for(let symbol in this.state.markets){
            this.perpSymbols.push(symbol);
            let market = await this.state.getMarketBySymbol(symbol);
            this.perpMarkets.push(market);
        }
        while(this.botActive) {
            let startTime = Date.now();
            for(let i = 0; i < this.perpMarkets.length; i++) {
                await this.getFills(this.perpMarkets[i], this.perpSymbols[i]);
            }
            this.seen = 0;
            this.valid = 0;
            let endTime = Date.now();
            let delta = (endTime - startTime)/1000;
            log.info(`[parsed ${this.valid} new market orders of ${this.seen} fills in ${delta} seconds]`);
            await sleep(SLEEP_DURATION);
        }
    }

}