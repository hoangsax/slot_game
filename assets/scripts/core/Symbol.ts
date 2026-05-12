import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SymbolSprite')
export class SymbolSprite {
    @property({ displayName: 'Prefab ID' })
    name = "";
    @property({ displayName: 'Symbol Prefab', type: SpriteFrame })
    sprite: SpriteFrame = null;
}

@ccclass('Symbol')
export class Symbol extends Component {
    @property(Sprite)
    showSprite: Sprite;
    @property([SymbolSprite])
    sprites: SymbolSprite[] = [];

    _spriteMap = new Map<string, SpriteFrame>();

    protected onLoad(): void {
        this.node['setSprite'] = this.setSprite.bind(this);
        this.sprites.forEach((item) => {
            this._spriteMap.set(item.name, item.sprite);
        })
    }

    setSprite(spriteName: string){
        this.showSprite.spriteFrame = this._spriteMap.get(spriteName);
    }
}

