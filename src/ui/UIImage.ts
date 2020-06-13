import { View } from "../core/View";
import { ViewScene } from "../core/ViewScene";
import { Texture, Sprite, TileSprite } from "../phaser";
import { MathUtils } from "../utils/Math";
import { SerializeInfo } from "../annotations/Serialize";

export enum ETextureScaleType {
    None,
    Tile,
    NinePatch,    
}

export interface INinePatchInfo {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;

    stretchMode?: number | {
        edge: number, // 'scale', or 1, 'repeat'
        internal: number, // 'scale', or 1, 'repeat'
    };
}

export class NinePatchInfo {
    public left?: number = 0;
    public right?: number = 1;
    public top?: number = 0;
    public bottom?: number = 1;

    stretchMode?: number | {
        edge: number, // 'scale', or 1, 'repeat'
        internal: number, // 'scale', or 1, 'repeat'
    };
}

export interface IUIImage {
    textureKey: string;
    textureFrame?: string | number;
    scaleType?: ETextureScaleType;
    tile?: {
        scaleX?: number;
        scaleY?: number;
    }
    ninePatch?: NinePatchInfo;  

    flipX?: boolean;
    flipY?: boolean;
}

export class UIImage extends View implements IUIImage{
    static get SERIALIZABLE_FIELDS(): SerializeInfo[] {
        let fields = View.SERIALIZABLE_FIELDS;
        fields.push(
            {property: "textureKey", importAs: "_textureKey", alias:"texture", type: String},
            {property: "textureFrame", importAs: "_textureFrame", alias:"frame", type: String},
            {property: "scaleType", importAs: "_scaleType", type: ETextureScaleType, default: ETextureScaleType.None},
            {property: "tile", importAs: "_tile", default: null},
            {property: "ninePatch", importAs: "_ninePatch", default: null},
            {property: "flipX", importAs: "_flipX", default: false},
            {property: "flipY", importAs: "_flipY", default: false},
        );
        return fields;
    }
    
    private _disp: TileSprite | Sprite | NinePatch;

    private _textureKey?: string;
    private _textureFrame?: string;
    private _scaleType: ETextureScaleType = ETextureScaleType.None;
    private _tile?: {scaleX: number, scaleY: number};
    private _ninePatch?: NinePatchInfo;  
    private _flipX: boolean = false;
    private _flipY: boolean = false;    

    constructor(scene: ViewScene, config?: IUIImage|any) {
        super(scene, config);        
        this._type = 3;
    }
    
    public get textureKey(): string {
        return this._textureKey;
    }
    public get scaleType(): ETextureScaleType {
        return this._scaleType;
    }
    public get textureFrame(): string | number {
        return this._textureFrame;
    }
    public get tile() {
        return this._tile;
    }
    public get ninePatch(): NinePatchInfo {
        return this._ninePatch;
    }
    public get flipX(): boolean {
        return this._flipX;
    }
    public get flipY(): boolean {
        return this._flipY;
    }

    private _updateSize() {
        if(this._disp) {
            if(this._disp instanceof Sprite) {
                this._disp.displayWidth = this.width;
                this._disp.displayHeight = this.height;
            }else if(this._disp instanceof NinePatch) {
                this._disp.resize(this.width || 1, this.height || 1);
            }else {
                this._disp.width = this.width;
                this._disp.height = this.height;
            }
        }
    }

    protected handleSizeChanged() {
        super.handleSizeChanged();

        this._updateSize();        
    }

    private _updateInfo() {
        if(!this._disp) {
            return;
        }

        if(this._disp instanceof TileSprite && this.tile) {
            let tile = this._tile;
            this._disp.tileScaleX = MathUtils.isNumber(tile.scaleX) ?  tile.scaleX : 1;
            this._disp.tileScaleY = MathUtils.isNumber(tile.scaleY) ?  tile.scaleY : 1;
        }
        this._disp.flipX = this._flipX || false;
        this._disp.flipY = this._flipY || false;
    }

    private _updateTexture() {
        if(this._disp) {
            this._disp.destroy();
            this._disp = null;
        }

        let x = this.x;
        let y = this.y;
        let width = this.width;
        let height = this.height;
        let texture = this._scene.textures.get(this._textureKey);
        let frame = texture.get(0);
        if(!frame) {
            console.error(`can not find texture named ${this._textureKey}`);
            return;
        }
        switch(this._scaleType){
            case ETextureScaleType.Tile:
                this._disp = this._scene.add.tileSprite(x, y, width, height, this._textureKey, this._textureFrame);
                break;
            case ETextureScaleType.NinePatch:
                let columns: number[] = [], rows: number[] = [];
                let ninePatch = this._ninePatch;
                let left = MathUtils.isNumber(ninePatch.left) ? ninePatch.left : 0;
                let right = MathUtils.isNumber(ninePatch.right) ? ninePatch.right : 1;
                let top = MathUtils.isNumber(ninePatch.top) ? ninePatch.top : 0;
                let bottom = MathUtils.isNumber(ninePatch.bottom) ? ninePatch.bottom : 1;
                if(!ninePatch 
                    || (top == 0 && left == 0 && right == 1 && bottom == 1)) {
                        this._disp = this._scene.add.sprite(x, y, this._textureKey, this._textureFrame);    
                }else {
                    let hl = left * frame.width || 1;
                    let hr = frame.width - frame.width * right || 1;
                    let hm = frame.width - hl - hr || 1;
                    columns = [hl, hm, hr];

                    let vt = top * frame.height || 1;
                    let vb = frame.height - frame.height * bottom || 1;
                    let vm = frame.height - vt - vb || 1;
                    rows = [vt, vm, vb];

                    let cfg: any = {};
                    if(ninePatch.stretchMode) {
                        cfg.stretchMode = ninePatch.stretchMode;
                    }

                    this._disp = this._scene.addExt.ninePatchTexture(x, y, width || frame.width, height || frame.width, 
                        this._textureKey, this._textureFrame as any, columns, rows, cfg);
                }
                break;            
            default:
                this._disp = this._scene.add.sprite(x, y, this._textureKey, this._textureFrame);
                break;
        }

        this.setDisplayObject(this._disp);
        if(this._disp) {
            this._disp.setOrigin(0, 0);
        }
        this._updateSize();
        this._updateInfo();

        this.setDisplayObject(this._disp);
    }

    public fromJSON(config: any) {
        if(!config) {
            return;
        }
        super.fromJSON(config);

        this._updateTexture();
    }
}