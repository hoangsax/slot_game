import { _decorator, Component, instantiate, JsonAsset, Node, Prefab } from 'cc';
import { GameEventManager } from './GameEventManager';
import { EventName } from '../utils/constants';
const { ccclass, property } = _decorator;

@ccclass('SymbolPrefabs')
export class SymbolPrefabs {
    @property({displayName: 'Prefab ID'})
    prefabName = "";
    @property({displayName: 'Symbol Prefab', type: Prefab})
    symbolPrefab: Prefab = null;
}

@ccclass('TableManager')
export class TableManager extends Component {
    @property([Node])
    reels: Node[] = [];
    @property({ type: [SymbolPrefabs] })
    symbols: SymbolPrefabs[] = [];

    _tableValues: JsonAsset = null;
    _eventManager: GameEventManager = null;
    _symbolMap = new Map<string, Prefab>();
    _symbols = [];
    protected onEnable(): void {
        this._eventManager?.on(EventName.UPDATE_TABLE, this.onUpdateTable, this)
    }

    protected start(): void {
        this._eventManager = globalThis.testGame.eventManager;
        this._eventManager.on(EventName.UPDATE_BET_SIZE, this.onUpdateTable, this);
        this.symbols.forEach((item) => {
            this._symbolMap.set(item.prefabName, item.symbolPrefab);
        })
    }

    getMatrixFromData(){
        return this._tableValues.json.matrix;
    }

    onUpdateTable(data: string) {
        this._tableValues = globalThis.testGame.getDataByBetId(data);
        this._symbols.forEach((item) => {
            item.removeFromParent();
        });
        this.updateTable();
    }

    updateTable() {
        const matrix = this.getMatrixFromData();
        for (let i = 0; i < matrix.length; i++) {
            const symbol = instantiate(this._symbolMap.get(matrix[i].toString()));
            this._symbols.push(symbol);
            this.reels[i % this.reels.length].addChild(symbol);
        }
        this.reels.forEach((item) => {
            for (let i = 0; i < 2; i++){
                const tempId = Math.floor(Math.random() * 11);
                const symbol = instantiate(this._symbolMap.get(this.convertNumberToSymbolId(tempId)));
                item.insertChild(symbol, i == 0? 0 : item.children.length);
            }
        })

    }

    convertNumberToSymbolId(value: number): string{
        switch (value) {
            case 0:
                return 'A'
                break;
            case 1:
                return 'JP'
                break;
            case 10:
                return 'K'
                break;
            default:
                return value.toString();
                break;
        }
    }
}

