import Size = Phaser.Structs.Size;
import Matrix3 = Phaser.Math.Matrix3;
import Vector2 = Phaser.Math.Vector2;
import Scale = Phaser.Scale;

export interface IStageOptions {
    orientation?: Scale.Orientation;
    [key: string]: string | number;
}

export class DefaultStageOptions {
    orientation?: Scale.Orientation = null;
    [key: string]: string | number;
}

let boot = (Phaser.Scale.ScaleManager.prototype as any).boot;
(Phaser.Scale.ScaleManager.prototype as any).boot = function() {
    boot.call(this);

    this.refresh();
};

Phaser.Scale.ScaleManager.prototype.updateBounds = function ()
{
    var bounds = this.canvasBounds;
    var clientRect = this.canvas.getBoundingClientRect();

    bounds.x = clientRect.left + (window.pageXOffset || 0) - (document.documentElement.clientLeft || 0);
    bounds.y = clientRect.top + (window.pageYOffset || 0) - (document.documentElement.clientTop || 0);
    bounds.width = clientRect.width;
    bounds.height = clientRect.height;

    if ((this as any).__rotation !== 0) {
        [bounds.x, bounds.y] = [bounds.y, bounds.x];
        [bounds.width, bounds.height] = [bounds.height, bounds.width];
    } 
};

(Phaser.Scale.ScaleManager.prototype as any).transformXY = function(pageX: number, pageY: number): Vector2 {
    let that = this as Scale.ScaleManager;
    let newx = pageX, newy = pageY;
    newx = (newx - this.canvasBounds.left);
    newy = (newy - this.canvasBounds.top);

    if (this.__rotation == 90) {
        newx = pageY;
        newy = this.canvasBounds.height - pageX;
    }
    else if (this.__rotation == -90) {
        newx = this.canvasBounds.width - pageY;
        newy = pageX;
    }
    
    newx = newx * this.displayScale.x;
    newy = newy * this.displayScale.y;

    return new Vector2(newx, newy);
};

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


export class OrientationPlugin extends Phaser.Plugins.BasePlugin {
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
        this.game.scale.on(Scale.Events.RESIZE, this._sizeChanged.bind(this));
    }

    stop() {
        this.game.scale.off(Scale.Events.RESIZE, this._sizeChanged.bind(this));
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
        this.game.scale.parent.style.overflow = 'hidden';
    }

    private _getOffsetXY(gameWidth: number, gameHeight: number, parentWidth: number, parentHeight: number): Vector2 {
        let scale = this.game.scale;
        var width = gameWidth;
        var height = gameHeight;
        var styleWidth;
        var styleHeight;
        var zoom = scale.zoom;
        var autoRound = scale.autoRound;
        var resolution = 1;
        scale.parentSize.setSize(parentWidth, parentHeight);

        if (scale.scaleMode === Scale.ScaleModes.NONE)
        {
            //  No scale
            scale.displaySize.setSize((width * zoom) * resolution, (height * zoom) * resolution);

            styleWidth = scale.displaySize.width / resolution;
            styleHeight = scale.displaySize.height / resolution;

            if (autoRound)
            {
                styleWidth = Math.floor(styleWidth);
                styleHeight = Math.floor(styleHeight);
            }
        }
        else if (scale.scaleMode === Scale.ScaleModes.RESIZE)
        {
            //  Resize to match parent

            //  This will constrain using min/max
            scale.displaySize.setSize(scale.parentSize.width, scale.parentSize.height);

            scale.gameSize.setSize(scale.displaySize.width, scale.displaySize.height);

            scale.baseSize.setSize(scale.displaySize.width * resolution, scale.displaySize.height * resolution);

            styleWidth = scale.displaySize.width / resolution;
            styleHeight = scale.displaySize.height / resolution;

            if (autoRound)
            {
                styleWidth = Math.floor(styleWidth);
                styleHeight = Math.floor(styleHeight);
            }
        }
        else
        {
            //  All other scale modes
            scale.displaySize.setSize(scale.parentSize.width, scale.parentSize.height);

            styleWidth = scale.displaySize.width / resolution;
            styleHeight = scale.displaySize.height / resolution;

            if (autoRound)
            {
                styleWidth = Math.floor(styleWidth);
                styleHeight = Math.floor(styleHeight);
            }
        }
        
        return new Vector2(styleWidth, styleHeight);
    }

    private _sizeChanged(gameSize:Size, baseSize: Size, displaySize: Size, resolution: number, previousWidth: number, previousHeight: number) {
        if((this.game.scale as any).___locked) {
            (this.game.scale as any).___locked = false;
            return;
        }
        
        let canvas = this.game.canvas;
        let scale = this.game.scale;
        let width = gameSize.width;
        let height = gameSize.height;

        let shouldRotate = false;
        var DOMRect = scale.parent.getBoundingClientRect();
        if (scale.parentIsWindow && scale.game.device.os.iOS)
        {
            DOMRect.height = (scale as any).GetInnerHeight(true);
        }
        let pwidth = DOMRect.width;
        let pheight = DOMRect.height;

        let mat = this._canvasMatrix.identity();        
        let canvasStyle:any = canvas.style;
        canvasStyle.transformOrigin = 
            canvasStyle.webkitTransformOrigin = 
            canvasStyle.msTransformOrigin = 
            canvasStyle.mozTransformOrigin = 
            canvasStyle.oTransformOrigin = "0px 0px 0px";

        let rotDeg = 0;
        let rotate = 0;
        if(this._options.orientation !== null) { 
            let rotType = pwidth / pheight < 1 ? Scale.Orientation.PORTRAIT : Scale.Orientation.LANDSCAPE;
            shouldRotate = rotType != this._options.orientation;
            if(shouldRotate) {
                [pwidth, pheight] = [pheight, pwidth];
            }

            if(shouldRotate) {
                let offset = this._getOffsetXY(height, width, pwidth, pheight);

                if(this._options.orientation == Scale.Orientation.LANDSCAPE) {
                    rotate = 90;
                    rotDeg = Math.PI / 2;
                    mat.rotate(rotDeg);
                    mat.translate(new Vector2(0, -offset.y));   
                    let temp = width;
                    width = Math.max(width, height);
                    height = Math.min(temp, height);             
                }else{
                    rotate = -90;
                    rotDeg = -Math.PI / 2;
                    mat.rotate(rotDeg);
                    mat.translate(new Vector2(-offset.x, 0));   
                    let temp = width;                  
                    width = Math.min(width, height);
                    height = Math.max(temp, height);
                }            
            }
        }  
        // mat.scale(new Vector2(1/resolution, 1/resolution));
            
        // https://www.cnblogs.com/wen-k-s/p/11375356.html
        mat.val[0] = this._formatData(mat.val[0]); //a
        mat.val[4] = this._formatData(mat.val[4]); //d
        mat.val[6] = this._formatData(mat.val[6]); //tx
        mat.val[7] = this._formatData(mat.val[7]); //ty

        canvasStyle.transform = 
        canvasStyle.webkitTransform = 
        canvasStyle.msTransform = 
        canvasStyle.mozTransform = 
        canvasStyle.oTransform = `matrix(${mat.val[0]},${mat.val[1]},${mat.val[3]},${mat.val[4]},${mat.val[6]},${mat.val[7]})`;          
        
        (this.game.scale as any).__rotation = rotate;
        (scale as any).___locked = true;
        scale.setParentSize(pwidth, pheight);
        scale.emit('user_resize', width, height, rotDeg);
    }

    private _formatData(value: number): number {
        if (Math.abs(value) < 0.000001) return 0;
        if (Math.abs(1 - value) < 0.001) return value > 0 ? 1 : -1;
        return value;
    }
}