import { View } from "../core/View";
import { Sprite } from "../phaser";
import { ISerializeFields } from "../types";
import { clone } from "../utils/Serialize";

export class MovieClip extends View {
    static TYPE = "movieclip";

    static SERIALIZE_INIT() 
    {      
        let fields = View.SERIALIZABLE_FIELDS;  
        fields.touchable.default = false;
    }

    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        clone(View.SERIALIZABLE_FIELDS),
        {
            textureKey: {importAs: "_textureKey", alias:"texture"},
            textureFrame: {importAs: "_textureFrame", alias:"frame"},
        }
    );

    private _disp: Sprite;
    private _textureKey?: string;
    private _textureFrame?: string | number;

    private _requireRender: boolean;

    protected fromConstruct() {     
        super.fromConstruct();
    }

    protected fromConfig(config: any, tpl?:any) {
        super.fromConfig(config, tpl);
        
        this._updateTexture();
    }

    private _getFrame() {        
        let texture = this.scene.textures.get(this._textureKey);
        let frameName = this._textureFrame === undefined ? "__BASE" : this._textureFrame;
        let frame = texture.get(frameName);
        return frame;
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

    private _updateTexture(rebuild: boolean = true) {
        if(this.inBuilding) {
            return;
        }

        if(rebuild && this._disp) {
            this._disp.destroy();
            this._disp = null;
        }
        this._requireRender = false;

        let frame = this._getFrame();
        if(!frame) {
            console.error(`can not find texture named ${this._textureKey}`);
            return;
        }
       
        if(this._disp instanceof Sprite) {
            this._disp.setTexture(this._textureKey, this._textureFrame);
        }else{
            this._disp = this.scene.add.sprite(0, 0, this._textureKey, this._textureFrame);
        }

        this.setDisplayObject(this._disp);
        if(this._disp) {
            this._disp.setOrigin(0, 0);
        }

        this._updateSize();
        this._updateInfo();
    }

    private _updateSize() {
        if(!this._disp) {
            return;
        }

        this._disp.displayWidth = this.width;
        this._disp.displayHeight = this.height;
    }

    private _updateInfo() {
        if(!this._disp) {
            return;
        }

        this._disp.tint = this.tint;
        this._disp.alpha = this.alpha;
    }
}