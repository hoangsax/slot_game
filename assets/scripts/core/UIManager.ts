import { _decorator, Button, Component, Label, Node } from 'cc';
import { GameEventManager } from './GameEventManager';
import { EventName } from '../utils/constants';
import { formatMoney, tweenMoney } from '../utils/utils';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property({ group: 'Text', type: Label})
    jackpot: Label;
    @property({ group: 'Text', type: Label})
    wallet: Label;
    @property({ group: 'Text', type: Label})
    betSize: Label;
    @property({ group: 'Text', type: Label})
    bet: Label;
    @property({ group: 'Text', type: Label})
    total: Label;

    @property({ group: 'Button', type: Button})
    plus: Button;
    @property({ group: 'Button', type: Button })
    minus: Button;


    _eventManager: GameEventManager = null;
    _betDetail = new Map<string, string>();
    _jackpotDetail = new Map<string, string>();
    _betIDs = [];
    _currentSize: string;
    _credits = 25;

    protected onEnable(): void {
        this._eventManager?.on('JOIN_GAME_SUCCESS', this.onJoinGameSuccess, this)
    }

    protected start(): void {
        this._eventManager = globalThis.testGame.eventManager;
        this._eventManager.on('JOIN_GAME_SUCCESS', this.onJoinGameSuccess, this);
        this.bet.string = `${this._credits} credits`;
    }

    onJoinGameSuccess(data: any) {
        this.wallet.string = `$${data.wallet}`;

        data.mainBet.split(",").map((item: any) => {
            const temp = item.split(';');
            this._betDetail.set(temp[0], temp[1]);
            this._betIDs.push(temp[0]);
        })

        const jackpotKeys = Object.keys(data.jackpot);
        jackpotKeys.map((item: any) => {
            this._jackpotDetail.set(this._betIDs[jackpotKeys.indexOf(item)], data.jackpot[item]);
        })

        this.updateBetState();
    }

    updateBetState(level: string = '10') {
        this.total.string = `$${formatMoney(Number(this._betDetail.get(level)))}`;
        this.betSize.string = `${Number(this._betDetail.get(level))/this._credits}`;
        tweenMoney(this.jackpot, 1, Number(this._jackpotDetail.get(level)), {"acceptRunDown": true}, (value) => {
            return `$${formatMoney(value)}`;
        });

        this._currentSize = level;
        if (this._betIDs.indexOf(this._currentSize) === 0){
            this.minus.interactable = false;
        } else {
            this.minus.interactable = true;
        }
        if (this._betIDs.indexOf(this._currentSize) === this._betIDs.length - 1){
            this.plus.interactable = false;
        } else {
            this.plus.interactable = true;
        }

        this._eventManager.emit(EventName.UPDATE_BET_SIZE, this._currentSize);
    }

    decreaseBetSize() {
        let index = this._betIDs.indexOf(this._currentSize);
        this.updateBetState(this._betIDs[index - 1]);
    }

    increaseBetSize() {
        let index = this._betIDs.indexOf(this._currentSize);
        this.updateBetState(this._betIDs[index + 1]);
    }
}

