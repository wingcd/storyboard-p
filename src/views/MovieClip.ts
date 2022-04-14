import { View } from "../core/View";
import { Sprite } from "../phaser";
import { ISerializeFields } from "../types";
import { clone } from "../utils/Serialize";

class FrameData {
    static SERIALIZABLE_FIELDS: ISerializeFields = {
        textureKey: {alias:"texture"},
        textureFrame: {alias:"frame"},
        interval: {},
    };

    public textureKey?: string;
    public textureFrame?: string | number;
    public interval: number = 0;

}

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
            frames: {importAs:"_frames"},
        }
    );

    public interval: number = 0;
    public swing: boolean;
    public repeatDelay: number = 0;
    public autoPlay: boolean = true;

    private _disp: Sprite;
    private _frames: FrameData[] = [];
    private _currentFrame: FrameData;
    private _currentIndex: number = 0;

    //settings
    private _startFrame: number;
    private _endFrame: number;
    //-1：loop forever
    private _repeatCount: number;  
    private _playing: boolean;  

    private _requireRender: boolean;
    private _timer: number = 0;
    private _currentInterval: number = 0;
    private _direction: number = 1;
    private _repeatCounter = 0;

    protected fromConstruct() {     
        super.fromConstruct();
    }

    protected fromConfig(config: any, tpl?:any) {
        super.fromConfig(config, tpl);
        
        this._updateTexture();
    }

    private _getFrame() {     
        if(this._currentFrame) {   
            let texture = this.scene.textures.get(this._currentFrame.textureKey);
            let frameName = this._currentFrame.textureFrame === undefined ? "__BASE" : this._currentFrame.textureFrame;
            let frame = texture.get(frameName);
            return frame;
        }
        return null;
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
       
        if(this._currentFrame) {
            if(this._disp instanceof Sprite) {
                this._disp.setTexture(this._currentFrame.textureKey, this._currentFrame.textureFrame);
            }else{
                this._disp = this.scene.add.sprite(0, 0, this._currentFrame.textureKey, this._currentFrame.textureFrame);
            }
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

    public play() {
        if(!this._playing) {
            this._playing = true;
        }
    }

    onUpdate(time: number, delta: number) {
        super.onUpdate(time, delta);

        let repeatCount = this._repeatCount || 0;
        let done = false;
        let oneTimeDone = false;
        let start = this._startFrame || 0;
        let end = this._endFrame || this._frames.length-1;
        if(this._playing) {
            if(this._timer > this._currentInterval) {
                if(this._direction > 0) {
                    if(this._currentIndex + 1 <= end) {
                        this._currentIndex = this._currentIndex + 1;
                    }else{
                        if(this.swing) {
                            this._currentIndex = this._currentIndex - 1;
                            this._direction = -1;
                        }else{
                            this._repeatCounter++;
                            if(this._repeatCounter > repeatCount) {
                                this._direction = 1;
                                // 重置为初始帧
                                this._currentIndex = start;
                                done = true;
                            }
                            oneTimeDone = true;
                        }
                    }
                }else{
                    if(this._currentIndex - 1 >= start) {
                        this._currentIndex = this._currentIndex - 1;
                    }else{
                        this._repeatCounter++;                        
                        if(this._repeatCounter > repeatCount) {
                            this._direction = 1;
                            this._currentIndex = start;
                            done = true;
                        }
                        oneTimeDone = true;
                    }
                }

                this._currentFrame = this._frames[this._currentIndex];
                if(oneTimeDone) {
                    this._currentInterval = this.repeatDelay || this._currentFrame.interval;
                }else{
                    this._currentInterval = this._currentFrame.interval || 0;
                }
                this._updateTexture();

                if(done) {
                    this._playing = false;
                }
            }
            this._timer += delta;
        }
    }
}