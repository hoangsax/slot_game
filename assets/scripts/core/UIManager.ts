import { _decorator, Button, Component, JsonAsset, Label, Node } from 'cc';
import { GameEventManager } from './GameEventManager';
import { EventName } from '../utils/constants';
import { formatMoney, parseValueFromString, tweenMoney } from '../utils/utils';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property({ group: 'Text', type: Label })
    jackpot: Label;
    @property({ group: 'Text', type: Label })
    wallet: Label;
    @property({ group: 'Text', type: Label })
    betSize: Label;
    @property({ group: 'Text', type: Label })
    bet: Label;
    @property({ group: 'Text', type: Label })
    total: Label;

    @property({ group: 'Button', type: Button })
    plus: Button;
    @property({ group: 'Button', type: Button })
    minus: Button;
    @property({ group: 'Button', type: Button })
    spin: Button;

    _eventManager: GameEventManager = null;
    _serverData: JsonAsset = null;
    _betDetail = new Map<string, number>();
    _jackpotDetail = new Map<string, number>();
    _betIDs = [];
    _currentBetSize: string = '';
    _credits = 25;

    protected onLoad(): void {
        this.resetButton(false);
        this.initState();
    }

    protected onEnable(): void {
        this._eventManager?.on('JOIN_GAME_SUCCESS', this.onJoinGameSuccess, this)
    }

    protected start(): void {
        this._eventManager = globalThis.testGame.eventManager;
        this._eventManager.on(EventName.JOIN_GAME_SUCCESS, this.onJoinGameSuccess, this);
        // this._eventManager.on(EventName.RECEIVE_SPIN_RESULT, this.onReceiveSpinResult, this);
        this._eventManager.on(EventName.FINISH_SHOW_RESULT, this.onFinishShowResult, this);
    }

    initState() {
        this.wallet.string = `$0`;
        this.total.string = `$0`;
        this.betSize.string = `0`;
        this.bet.string = `0 credits`;
        this.jackpot.string = `$0`;
    }

    resetButton(value: boolean = true) {
        this.plus.interactable = value;
        this.minus.interactable = value;
        this.spin.interactable = value;
    }

    onJoinGameSuccess(data: any) {
        this.resetButton(true);
        this.wallet.string = `$${formatMoney(data.wallet)}`;

        data.mainBet.split(",").map((item) => {
            const betId_betValue = item.split(';');
            this._betDetail.set(betId_betValue[0], Number(betId_betValue[1]));
            this._betIDs.push(betId_betValue[0]);
        })

        const jackpotKeys = Object.keys(data.jackpot);
        jackpotKeys.map((item) => {
            this._jackpotDetail.set(this._betIDs[jackpotKeys.indexOf(item)], Number(data.jackpot[item]));
        })
        this.bet.string = `${this._credits} credits`;
        this.updateBetState();
    }

    onFinishShowResult() {
        this._serverData = globalThis.testGame.getDataByBetId(this._currentBetSize);
        this.resetButton(true);
        tweenMoney(this.wallet, 1, parseValueFromString(this.wallet.string) + this._serverData.json.winAmount, { "acceptRunDown": true }, (value) => {
            return `$${formatMoney(value)}`;
        });
        if (this._betIDs.indexOf(this._currentBetSize) == 0) {
            this.minus.interactable = false;
        }
        if (this._betIDs.indexOf(this._currentBetSize) == this._betIDs.length - 1) {
            this.plus.interactable = false;
        }
    }

    updateBetState(level: string = '10') {
        this.total.string = `$${formatMoney(Number(this._betDetail.get(level)))}`;
        this.betSize.string = `${Number(this._betDetail.get(level)) / this._credits}`;
        tweenMoney(this.jackpot, 1, this._jackpotDetail.get(level), { "acceptRunDown": true }, (value) => {
            return `$${formatMoney(value)}`;
        });

        this._currentBetSize = level;
        if (this._betIDs.indexOf(this._currentBetSize) === 0) {
            this.minus.interactable = false;
        } else {
            this.minus.interactable = true;
        }
        if (this._betIDs.indexOf(this._currentBetSize) === this._betIDs.length - 1) {
            this.plus.interactable = false;
        } else {
            this.plus.interactable = true;
        }

        this._eventManager.emit(EventName.UPDATE_BET_SIZE, this._currentBetSize);
    }

    decreaseBetSize() {
        let index = this._betIDs.indexOf(this._currentBetSize);
        this.updateBetState(this._betIDs[index - 1]);
    }

    increaseBetSize() {
        let index = this._betIDs.indexOf(this._currentBetSize);
        this.updateBetState(this._betIDs[index + 1]);
    }

    onSpinPress() {
        this._eventManager.emit(EventName.SPIN_PRESS);
        this.resetButton(false);
    }
}

