import Size = Phaser.Structs.Size;
import Matrix3 = Phaser.Math.Matrix3;
import Vector2 = Phaser.Math.Vector2;
import Scale = Phaser.Scale;
import Point = Phaser.Geom.Point;
import TransformMatrix = Phaser.GameObjects.Components.TransformMatrix;

export const enum EStageOrientation {
    AUTO = "auto",
    PORTRAIT = "portrait",
    LANDSCAPE = "landscape"
}

export const enum EStageScaleMode {
    NO_SCALE = "noScale",
    SHOW_ALL = "showAll",
    NO_BORDER = "noBorder",
    EXACT_FIT = "exactFit",
    FIXED_WIDTH = "fixedWidth",
    FIXED_HEIGHT = "fixedHeight",
    FIXED_AUTO = "fixedAuto",
    FULL = "full",
}

export const enum EStageAlign {
    LEFT,
    CENTER,
    RIGHT,
    TOP,
    MIDDLE,
    BOTTOM
}

export interface IStageOptions {
    orientation?: EStageOrientation;
    scaleMode?: EStageScaleMode;
    alignH?: EStageAlign;
    alignV?: EStageAlign;
    offsetX?: number;
    offsetY?: number;
    [key: string]: string | number;
}

export class DefaultStageOptions {
    orientation?: EStageOrientation = EStageOrientation.AUTO;    
    scaleMode?: EStageScaleMode = EStageScaleMode.NO_SCALE;
    alignH?: EStageAlign = EStageAlign.LEFT;
    alignV?: EStageAlign = EStageAlign.TOP;    
    offsetX?: number = 0;
    offsetY?: number = 0;
    [key: string]: string | number;
}

let transformPointer = Phaser.Input.InputManager.prototype.transformPointer;
let boot = (Phaser.Scale.ScaleManager.prototype as any).boot;
let parseConfig = (Phaser.Scale.ScaleManager.prototype as any).parseConfig;
let resize = Phaser.Scale.ScaleManager.prototype.resize;
let updateBounds = Phaser.Scale.ScaleManager.prototype.updateBounds;
let refresh = Phaser.Scale.ScaleManager.prototype.refresh;

(Phaser.Scale.ScaleManager.prototype as any).boot = function() {
    boot.call(this);

    this.refresh();
};

(Phaser.Scale.ScaleManager.prototype as any).parseConfig = function(config: any) {
    parseConfig.call(this, config);

    (this as any).__designSize = new Size(this.gameSize.width, this.gameSize.height);
    (this as any).__canvasMat = new TransformMatrix();
}

function __replaceScale() {   
    Phaser.Scale.ScaleManager.prototype.resize = function (width, height) {
        var previousWidth = this.width;
        var previousHeight = this.height;
        (this as any).__designSize.setSize(this.gameSize.width, this.gameSize.height);
        return this.refresh(previousWidth, previousHeight);
    }

    Phaser.Scale.ScaleManager.prototype.updateBounds = function ()
    {
        var bounds = this.canvasBounds;
        var clientRect = this.canvas.getBoundingClientRect();

        bounds.x = clientRect.left + (window.pageXOffset || 0) - (document.documentElement.clientLeft || 0);
        bounds.y = clientRect.top + (window.pageYOffset || 0) - (document.documentElement.clientTop || 0);
        bounds.width = clientRect.width;
        bounds.height = clientRect.height;

        if ((this as any).__rotation) {
            [bounds.width, bounds.height] = [bounds.height, bounds.width];
        } 
    };

    (Phaser.Scale.ScaleManager.prototype as any).transformXY = function(pageX: number, pageY: number, tempPos: Vector2 | Point): Vector2 | Point {
        let that = this as Scale.ScaleManager;
        let newx = pageX, newy = pageY;
        let x = (newx - this.canvasBounds.left);
        let y = (newy - this.canvasBounds.top);

        if (this.__rotation == 90) {
            newx = y;
            newy = this.canvasBounds.height - x;
        }
        else if (this.__rotation == -90) {
            newx = this.canvasBounds.width - y;
            newy = x;
        }else{
            newx = x;
            newy = y;
        }
        
        newx = newx / this.displayScale.x;
        newy = newy / this.displayScale.y;

        tempPos = tempPos || new Vector2();
        if(this.autoRound) {
            newx = Math.round(newx);
            newy = Math.round(newy);
        }
        tempPos.setTo(newx, newy);

        return tempPos;
    };

    (Phaser.Scale.ScaleManager.prototype as any).invertTransformXY = function(posX: number, posY: number, tempPos: Vector2 | Point): Vector2 | Point{
        let that = this as Scale.ScaleManager;
        let newx = posX, newy = posY;

        let x = newx * this.displayScale.x;
        let y = newy * this.displayScale.y;

        if (this.__rotation == 90) {
            newx = this.canvasBounds.height - y;
            newy = x;
        }
        else if (this.__rotation == -90) {
            newx = y;
            newy = this.canvasBounds.width - x;
        }else{
            newx = x;
            newy = y;
        }    
        
        newx = (newx + this.canvasBounds.left);
        newy = (newy + this.canvasBounds.top);

        tempPos = tempPos || new Vector2();
        if(this.autoRound) {
            newx = Math.round(newx);
            newy = Math.round(newy);
        }
        tempPos.setTo(newx, newy);

        return tempPos;
    };

    (Phaser.Scale.ScaleManager.prototype as any)._formatData = function(value: number): number {
        if (Math.abs(value) < 0.000001) return 0;
        if (Math.abs(1 - value) < 0.001) return value > 0 ? 1 : -1;
        return value;
    }

    Phaser.Scale.ScaleManager.prototype.refresh = function (previousWidth, previousHeight) 
    {
        if (previousWidth === undefined) { previousWidth = this.width; }
        if (previousHeight === undefined) { previousHeight = this.height; }

        let designSize = (this as any).__designSize as Size;
        var DOMRect = this.parent.getBoundingClientRect();
        if (this.parentIsWindow && this.game.device.os.iOS)
        {
            DOMRect.height = (this as any).GetInnerHeight(true);
        }
        let screenWidth = DOMRect.width;
        let screenHeight = DOMRect.height;

        let options = (this as any).__options as IStageOptions;
        let shouldRotate = false;
        if(options.orientation != EStageOrientation.AUTO) {
            let rotType = screenWidth / screenHeight < 1 ? EStageOrientation.PORTRAIT : EStageOrientation.LANDSCAPE;
            shouldRotate = rotType != options.orientation;
            if(shouldRotate) {
                let temp = screenHeight;
                screenHeight = screenWidth;
                screenWidth = temp;
            }
        }

        let mat = (this as any).__canvasMat.loadIdentity() as TransformMatrix;
        
        let scaleX = screenWidth / designSize.width;
        let scaleY = screenHeight / designSize.height;

        let canvasWidth = designSize.width;
        let canvasHeight = designSize.height;
        let realWidth = screenWidth;
        let realHeight = screenHeight;
        let pixelRatio = this.resolution || 1;
        let designWidth = designSize.width;
        let designHeight = designSize.height;       

        let width = designWidth;
        let height = designHeight; 
        switch(options.scaleMode) {
            case EStageScaleMode.NO_SCALE:
                scaleX = scaleY = 1;
                realWidth = designWidth;
                realHeight = designHeight;
                break;
            case EStageScaleMode.SHOW_ALL:
                scaleX = scaleY = Math.min(scaleX, scaleY);
                realWidth = Math.round(designSize.width * scaleX);
                realHeight = Math.round(designSize.height * scaleY);
                break;
            case EStageScaleMode.NO_BORDER:
                scaleX = scaleY = Math.max(scaleX, scaleY);
                realWidth = Math.round(designSize.width * scaleX);
                realHeight = Math.round(designSize.height * scaleY);
                break;
            case EStageScaleMode.EXACT_FIT: 
                canvasWidth = designWidth;
                canvasHeight = designHeight;
                break;
            case EStageScaleMode.FULL:
                scaleY = scaleX = 1;
                width = canvasWidth = screenWidth;
                height = canvasHeight = screenHeight;
                break;
            case EStageScaleMode.FIXED_WIDTH:                  
                scaleY = scaleX;
                height = canvasHeight = Math.round(screenHeight / scaleX);
                break;
            case EStageScaleMode.FIXED_HEIGHT:
                scaleX = scaleY;
                width = canvasWidth = Math.round(screenWidth / scaleY);
                break;
            case EStageScaleMode.FIXED_AUTO:
                if ((screenWidth / screenHeight) < (designSize.width / designSize.height)) {                    
                    scaleY = scaleX;
                    height = canvasHeight = Math.round(screenHeight / scaleX);     
                } else {
                    scaleX = scaleY;
                    width = canvasWidth = Math.round(screenWidth / scaleY);
                }
                break;
        }    

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        let offsetx = 0, offsety = 0;
        if(options.alignH == EStageAlign.LEFT) {
            offsetx = 0;
        }else if(options.alignH == EStageAlign.RIGHT) {
            offsetx = screenWidth - realWidth;
        }else{
            offsetx = (screenWidth - realWidth) * 0.5;
        }

        if(options.alignV == EStageAlign.TOP) {
            offsety = 0;
        }else if(options.alignV == EStageAlign.BOTTOM) {
            offsety = screenHeight - realHeight;
        }else {
            offsety = (screenHeight - realHeight) * 0.5;
        }

        offsetx += Math.round(options.offsetX);
        offsety += Math.round(options.offsetY);
        let rotDeg = 0;
        let rotate = 0;
        if(shouldRotate) {    
            if(options.orientation == EStageOrientation.LANDSCAPE) {
                rotate = 90;
                rotDeg = Math.PI / 2;
                mat.rotate(rotDeg);  
                mat.translate(0, -screenHeight);             
            }else{
                rotate = -90;
                rotDeg = -Math.PI / 2;
                mat.rotate(rotDeg);
                mat.translate(-screenWidth, 0);
            }
        }
        
        mat.translate(offsetx, offsety);
        mat.scale(realWidth / canvasWidth / pixelRatio, realHeight / canvasHeight / pixelRatio);
            
        // https://www.cnblogs.com/wen-k-s/p/11375356.html
        let that = this as any;
        mat.a = that._formatData(mat.a);
        mat.d = that._formatData(mat.d);
        mat.tx = that._formatData(mat.tx);
        mat.ty = that._formatData(mat.ty);

        let canvasStyle = this.canvas.style as any;
        canvasStyle.transformOrigin = 
            canvasStyle.webkitTransformOrigin = 
            canvasStyle.msTransformOrigin = 
            canvasStyle.mozTransformOrigin = 
            canvasStyle.oTransformOrigin = "0px 0px 0px";
        canvasStyle.transform = 
            canvasStyle.webkitTransform = 
            canvasStyle.msTransform = 
            canvasStyle.mozTransform = 
            canvasStyle.oTransform = `matrix(${mat.a},${mat.b},${mat.c},${mat.d},${mat.tx},${mat.ty})`;   
            
        that.__rotation = rotate;
        this.displaySize.setAspectMode(0);
        this.displayScale.set(scaleX, scaleY);
        this.displaySize.setSize(canvasWidth, canvasHeight);
        this.gameSize.setSize(width, height);
        this.baseSize.setSize(width * pixelRatio, height * pixelRatio);
        this.updateBounds();
        
        this.emit(Phaser.Scale.Events.RESIZE, this.gameSize, this.baseSize, this.displaySize, this.resolution, previousWidth, previousHeight);

        return this;
    };
};

function __resotreScale() {   
    Phaser.Input.InputManager.prototype.transformPointer = transformPointer;
    Phaser.Scale.ScaleManager.prototype.resize = resize;
    Phaser.Scale.ScaleManager.prototype.updateBounds = updateBounds;
    Phaser.Scale.ScaleManager.prototype.refresh = refresh;
}

Phaser.Input.InputManager.prototype.transformPointer = function (pointer, pageX, pageY, wasMove)
{
    var p0 = pointer.position;
    var p1 = pointer.prevPosition;

    //  Store previous position
    p1.x = p0.x;
    p1.y = p0.y;

    //  Translate coordinates
    var x = 0;
    var y = 0;
    if(!(this.scaleManager as any).transformXY) {
        x = this.scaleManager.transformX(pageX);
        y = this.scaleManager.transformY(pageY);
    }else{
        let pos = (this.scaleManager as any).transformXY(pageX, pageY);
        x = pos.x;
        y = pos.y;
    }

    var a = pointer.smoothFactor;

    if (!wasMove || a === 0)
    {
        //  Set immediately
        p0.x = x;
        p0.y = y;
    }
    else
    {
        //  Apply smoothing
        p0.x = x * a + p1.x * (1 - a);
        p0.y = y * a + p1.y * (1 - a);
    }
};

export class StageScalePlugin extends Phaser.Plugins.BasePlugin {
    private _options: IStageOptions;
    protected _canvasMatrix: Matrix3 = new Matrix3();
    
    constructor (pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager);
    }

    init(data: any) {
        this._options = data;
    }

    start() {        
        this._config(this._options);   
        __replaceScale();     
    }

    stop() {
        __resotreScale();
    }

    public get orientation(): EStageOrientation {
        return this._options.orientation;
    }

    public set orientation(val: EStageOrientation) {
        if(this._options.orientation != val) {
            this._options.orientation = val;
            this.game.scale.refresh();
        }
    }

    private _config(options: IStageOptions) {
        let opt: IStageOptions = null;
        if(options instanceof DefaultStageOptions) {
            opt = options;
        }else{
            opt = new DefaultStageOptions();
            if (options != null) {
                for (let i in options) {
                    opt[i] = options[i];
                }
            }
        }

        this._options = opt;
        (this.game.scale as any).__options = opt;
        this.game.scale.parent.style.overflow = 'hidden';
    }
}