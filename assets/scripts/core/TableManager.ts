import { _decorator, Component, instantiate, JsonAsset, Node, Prefab, tween, UITransform, Sprite, v3, animation } from 'cc';
import { GameEventManager } from './GameEventManager';
import { EventName } from '../utils/constants';
import { Symbol } from './Symbol';
const { ccclass, property } = _decorator;

export const matrixDimen = {
    height: 3,
    width: 5
}

@ccclass('TableManager')
export class TableManager extends Component {
    @property([Node])
    reels: Node[] = [];
    @property(Prefab)
    symbolPrefab: Prefab = null;

    _currentBetSize: string = '';
    _tableMatrix: JsonAsset = null;
    _eventManager: GameEventManager = null;
    _symbols: Node[] = [];
    _symbolHeight = 0;
    _hasResult = false;
    _resultShow = new Map<number, boolean>();
    _tweens = [];

    protected onLoad(): void {
    }

    protected onEnable(): void {
        this._eventManager?.on(EventName.UPDATE_TABLE, this.onUpdateTable, this)
    }

    protected start(): void {
        this._eventManager = globalThis.testGame.eventManager;
        this._eventManager.on(EventName.UPDATE_BET_SIZE, this.onUpdateTable, this);
        this._eventManager.on(EventName.SPIN_PRESS, this.onSpinPress, this);
        this._eventManager.on(EventName.RECEIVE_SPIN_RESULT, this.onReceiveSpinResult, this);

    }

    getMatrixFromData() {
        return this._tableMatrix?.json.matrix;
    }

    clearReel(reelId: number = null) {
        if (!reelId) {
            this.reels.forEach((item: Node) => {
                item.removeAllChildren();
            })
        }
    }

    onUpdateTable(data: string) {
        this.initTable();
        this._currentBetSize = data;
    }

    initTable() {
        this.clearReel();
        this.reels.forEach((item, index) => {
            for (let i = 0; i < matrixDimen.height + 2; i++) {
                this.createSymbol(index);
            }
        })
        this._symbolHeight = this.getComponent(UITransform).height;
    }

    createSymbol(reelId: number, symbolId: number = null) {
        let Id = ''
        if (!symbolId) {
            const tempId = Math.floor(Math.random() * 10);
            Id = this.mapSymbolId(tempId)
        } else {
            Id = this.mapSymbolId(symbolId)
        }
        const symbol = instantiate(this.symbolPrefab);
        this.reels[reelId].addChild(symbol);
        symbol.getComponent(Symbol).setSprite(Id);
        this._tweens.push(symbol)
        return symbol;
    }

    mapSymbolId(value: number): string {
        switch (value) {
            case 0:
                return 'JP'
                break;
            case 1:
                return 'A'
                break;
            case 10:
                return 'K'
                break;
            default:
                return value? (value > 10 ? '0' : String(value)) : null;
                break;
        }
    }

    spinReel(reelId: number) {
        const currentReel = this.reels[reelId];
        let tweenAnim = tween(currentReel)
            .by(0.1, { position: v3(0, - this._symbolHeight) })
            .call(() => {
                this.spinCallback(reelId);
                this.spinReel(reelId);
            })
        this._tweens.push(tweenAnim);
        if (this._hasResult) {
            tweenAnim.stop();
            this.stopSpin(reelId);
        } else {
            tweenAnim.start();
        }
    }

    stopSpin(reelId: number) {
        const currentReel = this.reels[reelId];
        const symbolIds = this.getMatrixFromData().slice(reelId * matrixDimen.height, (reelId + 1) * matrixDimen.height);
        let tweenAnim = tween(currentReel)
            .repeat(
                reelId * 3, 
                tween().by(0.1, { position: v3(0, - this._symbolHeight) })
                .call(() => {
                    this.spinCallback(reelId);
                }))
            .repeat(
                matrixDimen.height + 1, 
                tween().by(0.1, { position: v3(0, - this._symbolHeight) })
                .call(() => {
                    this.spinCallback(reelId, symbolIds);
                })
            )
        this._tweens.push(tweenAnim)
        tweenAnim.delay(0.5).call(() => {
            this._resultShow.set(reelId, true);
            this.checkFinishShowResult();
        }).start();


    }

    checkFinishShowResult() {
        let checkArray = Array.from(this._resultShow.values());
        for (let i = 0; i < checkArray.length; i++){
            if (!checkArray[i]){
                return;
            }
        }
        this._eventManager.emit(EventName.FINISH_SHOW_RESULT);
    }

    spinCallback(reelId: number, symbols: number[] = []) {
        const currentReel = this.reels[reelId];
        const originalPos = currentReel.getPosition().clone();
        let symbolId = 0;
        if (symbols.length){
            symbolId = symbols.pop()
        } else {
            symbolId = Math.floor(Math.random() * 10);
        }
        const symbol = currentReel.children[currentReel.children.length - 1];
        symbol.getComponent(Symbol).setSprite(this.mapSymbolId(symbolId));
        symbol.setSiblingIndex(0);
        currentReel.setPosition(v3(originalPos.x, originalPos.y + this._symbolHeight));
    }

    onSpinPress() {
        this._hasResult = false;
        this.reels.forEach((item, index) => {
            this._resultShow.set(index, false);
            this.spinReel(index);
        })
    }

    onReceiveSpinResult() {
        this._tableMatrix = globalThis.testGame.getDataByBetId(this._currentBetSize);
        this._hasResult = true;
    }

    protected onDestroy(): void {
        this._tweens.length && this._tweens.forEach((item) => {
            item.stop();
        })
    }
}

