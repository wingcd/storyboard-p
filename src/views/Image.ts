import { View } from "../core/View";
import { Sprite, TileSprite } from "../phaser";
import { MathUtils } from "../utils/Math";
import { ISerializeFields, IImage } from "../types";
import { FillMask } from "./FillMask";
import { INinePatchInfo, ITileInfo } from "../types";
import { EFillType, ETextureScaleType } from "../core/Defines";
import { clone } from "../utils/Serialize";

export class NinePatchInfo {
    static SERIALIZABLE_FIELDS: ISerializeFields = {
        left: {default: 0},
        right: {default: 1},
        top: {default: 0},
        bottom: {default: 1},

        stretchMode: {raw: true},
    };

    public left?: number = 0;
    public right?: number = 1;
    public top?: number = 0;
    public bottom?: number = 1;

    stretchMode?: number | {
        edge: number, // 'scale', or 1, 'repeat'
        internal: number, // 'scale', or 1, 'repeat'
    };
}

export class Image extends View  implements IImage {
    static TYPE = "image";

    static SERIALIZE_INIT() 
    {      
        let fields = Image.SERIALIZABLE_FIELDS;  
        fields.touchable.default = false;
    }

    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        clone(View.SERIALIZABLE_FIELDS),
        {
            textureKey: {importAs: "_textureKey", alias:"texture"},
            textureFrame: {importAs: "_textureFrame", alias:"frame"},
            scaleType: {importAs: "_scaleType", type: ETextureScaleType, default: ETextureScaleType.None},
            tile: {importAs: "_tile"},
            ninePatch: {importAs: "_ninePatch", type: NinePatchInfo},
            flipX: {importAs: "_flipX", default: false},
            flipY: {importAs: "_flipY", default: false},
            fillType: {importAs: "_fillType", default: EFillType.None},
            fillMask: {importAs: "_fillMask", type:FillMask},
        }
    );
        
    private _disp: TileSprite | Sprite | NinePatch;

    private _textureKey?: string;
    private _textureFrame?: string | number;
    private _scaleType: ETextureScaleType = ETextureScaleType.None;
    private _tile?: ITileInfo;
    private _ninePatch?: INinePatchInfo;
    private _flipX: boolean = false;
    private _flipY: boolean = false;   
    private _fillMask: FillMask;
    private _fillType: EFillType = EFillType.None;

    private _requireRender: boolean;

    protected fromConstruct() {     
        this.touchable = false;
    }

    protected fromConfig(config: any, tpl?:any) {
        super.fromConfig(config, tpl);
        
        this._updateTexture();
    }
    
    public get textureKey(): string {
        return this._textureKey;
    }
    public set textureKey(val: string) {
        if(this._textureKey != val) {
            this._textureKey = val;
            this.render();
        }
    }
    public get scaleType(): ETextureScaleType {
        return this._scaleType;
    }
    public set scaleType(val: ETextureScaleType) {
        if(this._scaleType != val) {
            this._scaleType = val;
            this.render();
        }
    }
    public get textureFrame(): string | number {
        return this._textureFrame;
    }
    public set textureFrame(val: string | number) {
        if(this._textureFrame != val) {
            this._textureFrame = val;
            this.render();
        }
    }
    public get tile() {
        return this._tile;
    }
    public set tile(val: ITileInfo) {
        if(this._tile != val) {
            this._tile = val;
            this._updateInfo();
        }
    }
    public get ninePatch(): INinePatchInfo {
        return this._ninePatch;
    }
    public set ninePatch(val: INinePatchInfo) {
        if(this._ninePatch != val) {
            this._ninePatch = val;
            this.render();
        }
    }
    public get flipX(): boolean {
        return this._flipX;
    }
    public set flipX(val:boolean) {
        if(this._flipX != val) {
            this._flipX = val;
            this._updateInfo();
        }
    }
    
    public get flipY(): boolean {
        return this._flipY;
    }

    public set flipY(val: boolean) {
        if(this._flipY != val) {
            this._flipY = val;
            this._updateInfo();
        }
    }

    public get fillType(): EFillType {
        return this._fillType;
    }

    public set fillType(val:EFillType) {
        if(val != this._fillType) {
            this._fillType = val;

            this.applyFillMask();
        }
    }

    public get fillMask(): FillMask {
        return this._fillMask;
    }

    protected applyFillMask() {
        if(this._fillType != EFillType.None) {
            if(!this._fillMask) {
                this._fillMask = new FillMask();
                this._fillMask.attach(this, this._disp);
            }
            this._fillMask.fillType = this._fillType;
        }else if(this._fillMask){
            this._fillMask.destory();
            this._fillMask = null;
        }
    }

    protected render() {
        if(this._requireRender) {
            return;
        }
        
        this._requireRender = true;
        this.scene.time.addEvent({
            delay: 1,
            callback: ()=>{
                this._render();
            },
        });
    }

    private _render() {
        if(this._requireRender) {
            this._updateTexture();
        }
    }

    private _getFrame() {        
        let texture = this.scene.textures.get(this._textureKey);
        let frameName = this._textureFrame === undefined ? "__BASE" : this._textureFrame;
        let frame = texture.get(frameName);
        return frame;
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
        this._disp.flipX = this._flipX;
        this._disp.flipY = this._flipY;
        this._disp.tint = this.tint;
        this._disp.alpha = this.alpha;

        if(this._fillMask) {
            this._fillMask.attach(this, this._disp);
        }
    }

    private _updateTexture(rebuild: boolean = true) {
        if(this.inBuilding) {
            return;
        }

        if(rebuild && this._disp) {
            this._disp.destroy();
            this._disp = null;
        }
        this._requireRender = false;

        let width = this.width;
        let height = this.height;
        let frame = this._getFrame();
        if(!frame) {
            console.error(`can not find texture named ${this._textureKey}`);
            return;
        }
        switch(this._scaleType){
            case ETextureScaleType.Tile:
                if(this._disp instanceof TileSprite) {
                    this._disp.setSize(width, height);
                    this._disp.setTexture(this._textureKey, this._textureFrame);
                }else{
                    this._disp = this.scene.add.tileSprite(0, 0, width, height, this._textureKey, this._textureFrame);
                }
                break;
            case ETextureScaleType.NinePatch:
                let columns: number[] = [], rows: number[] = [];
                let ninePatch = this._ninePatch || {};
                let left = MathUtils.isNumber(ninePatch.left) ? ninePatch.left : 0;
                let right = MathUtils.isNumber(ninePatch.right) ? ninePatch.right : 1;
                let top = MathUtils.isNumber(ninePatch.top) ? ninePatch.top : 0;
                let bottom = MathUtils.isNumber(ninePatch.bottom) ? ninePatch.bottom : 1;
                if(!ninePatch 
                    || (top == 0 && left == 0 && right == 1 && bottom == 1)) {
                        if(this._disp instanceof NinePatch) {
                            this._disp.destroy();
                            this._disp = null;
                        }

                        if(this._disp instanceof Sprite) {
                            this._disp.setTexture(this._textureKey, this._textureFrame);
                        }else{
                            this._disp = this.scene.add.sprite(0, 0, this._textureKey, this._textureFrame); 
                        }
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

                    if(this._disp instanceof NinePatch) { 
                        this._disp.setSize(width || frame.width, height || frame.width);
                        (this._disp as any).setTexture(this._textureKey, this._textureFrame, columns, rows);
                    }else{
                        this._disp = this.scene.addExt.ninePatchTexture(0, 0, width || frame.width, height || frame.width, 
                            this._textureKey, this._textureFrame as any, columns, rows, cfg);
                    }
                }
                break;            
            default:
                if(this._disp instanceof Sprite) {
                    this._disp.setTexture(this._textureKey, this._textureFrame);
                }else{
                    this._disp = this.scene.add.sprite(0, 0, this._textureKey, this._textureFrame);
                }
                break;
        }

        this.setDisplayObject(this._disp);
        if(this._disp) {
            this._disp.setOrigin(0, 0);
        }

        this._updateSize();
        this._updateInfo();
        this.applyFillMask();
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            super.fromJSON(config, template);
        }

        return this;
    }
}