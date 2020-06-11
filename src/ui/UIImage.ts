import { View } from "../core/View";
import { ViewScene } from "../core/ViewScene";
import { Texture, Sprite, TileSprite } from "../phaser";
import { MathUtils } from "../utils/Math";

export const enum ETextureScaleType {
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
        edge: 0, // 'scale', or 1, 'repeat'
        internal: 0, // 'scale', or 1, 'repeat'
    };
}

export class NinePatchInfo {
    public left?: number = 0;
    public right?: number = 1;
    public top?: number = 0;
    public bottom?: number = 1;

    stretchMode?: number | {
        edge: 0, // 'scale', or 1, 'repeat'
        internal: 0, // 'scale', or 1, 'repeat'
    };
}

export interface IImageInfo {
    texture: string;
    scaleType?: ETextureScaleType;
    frame?: string | number;
    tile?: {
        scaleX?: number;
        scaleY?: number;
    }
    ninePatch?: NinePatchInfo;  
}

export class ImageInfo {
    texture: string;
    scaleType?: ETextureScaleType = ETextureScaleType.None;
    frame?: string | number;
    ninePatch?: INinePatchInfo;    
}

export type TextureInfo = ImageInfo;

export class UIImage extends View {
    protected _disp: TileSprite | Sprite | NinePatch;
    private _options: IImageInfo;
    constructor(scene: ViewScene, config?: IImageInfo) {
        config = config || new ImageInfo();
        super(scene, config);
        
        this._type = 3;
        this._options = config;
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
        if(this._disp instanceof TileSprite && this._options.tile) {
            let tile = this._options.tile;
            this._disp.tileScaleX = MathUtils.isNumber(tile.scaleX) ?  tile.scaleX : 1;
            this._disp.tileScaleY = MathUtils.isNumber(tile.scaleY) ?  tile.scaleY : 1;
        }
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
        let texture = this._scene.textures.get(this._options.texture);
        let frame = texture.get(0);
        if(!frame) {
            console.error(`can not find texture named ${this._options.texture}`);
            return;
        }
        switch(this._options.scaleType){
            case ETextureScaleType.None:
                this._disp = this._scene.add.sprite(x, y, this._options.texture, this._options.frame);
                break;
            case ETextureScaleType.Tile:
                this._disp = this._scene.add.tileSprite(x, y, width, height, this._options.texture, this._options.frame);
                break;
            case ETextureScaleType.NinePatch:
                let columns: number[] = [], rows: number[] = [];
                let ninePatch = this._options.ninePatch;
                let left = MathUtils.isNumber(ninePatch.left) ? ninePatch.left : 0;
                let right = MathUtils.isNumber(ninePatch.right) ? ninePatch.right : 1;
                let top = MathUtils.isNumber(ninePatch.top) ? ninePatch.top : 0;
                let bottom = MathUtils.isNumber(ninePatch.bottom) ? ninePatch.bottom : 1;
                if(!ninePatch 
                    || (top == 0 && left == 0 && right == 1 && bottom == 1)) {
                        this._disp = this._scene.add.sprite(x, y, this._options.texture, this._options.frame);    
                }else {
                    let hl = left * frame.width || 1;
                    let hr = frame.width - frame.width * right || 1;
                    let hm = frame.width - hl - hr || 1;
                    columns = [hl, hm, hr];

                    let vt = top * frame.height || 1;
                    let vb = frame.height - frame.height * bottom || 1;
                    let vm = frame.height - vt - vb || 1;
                    rows = [vt, vm, vb];

                    this._disp = this._scene.addExt.ninePatchTexture(x, y, width || frame.width, height || frame.width, 
                        this._options.texture, this._options.frame as any, columns, rows);
                }
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

        this._options = config;
        this._updateTexture();
    }
}