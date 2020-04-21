import Size = Phaser.Structs.Size;
import Matrix3 = Phaser.Math.Matrix3;
import Vector2 = Phaser.Math.Vector2;
import Scale = Phaser.Scale;
import Point = Phaser.Geom.Point;

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

let parseConfig = (Phaser.Scale.ScaleManager.prototype as any).parseConfig;
(Phaser.Scale.ScaleManager.prototype as any).parseConfig = function(config: any) {
    parseConfig.call(this, config);

    (this as any).__designSize = new Size(this.gameSize.width, this.gameSize.height);
}

let oldResize = Phaser.Scale.ScaleManager.prototype.resize;
Phaser.Scale.ScaleManager.prototype.resize = function (width, height) {
    let ret = oldResize.call(this, width, height);
    (this as any).__designSize.setSize(this.gameSize.width, this.gameSize.height);
    return ret;
}

Phaser.Scale.ScaleManager.prototype.updateScale = function ()
{
    let designSize = (this as any).__designSize;
    this.gameSize.setSize(designSize.width, designSize.height);

    var style = this.canvas.style;

    var zoom = this.zoom;
    var autoRound = this.autoRound;
    var resolution = 1;

    var width = designSize.width;
    var height = designSize.height;

    let scaleX = this.parentSize.width / width;
    let scaleY = this.parentSize.height / height;

    var styleWidth;
    var styleHeight;    
        
    this.gameSize.setSize(width, height);  
    this.baseSize.setSize(width * resolution, height * resolution);

    if (this.scaleMode === Scale.ScaleModes.NONE)
    {
        //  No scale
        this.displaySize.setSize((width * zoom) * resolution, (height * zoom) * resolution);

        styleWidth = this.displaySize.width / resolution;
        styleHeight = this.displaySize.height / resolution;

        if (autoRound)
        {
            styleWidth = Math.floor(styleWidth);
            styleHeight = Math.floor(styleHeight);
        }

        if (this._resetZoom)
        {
            style.width = styleWidth + 'px';
            style.height = styleHeight + 'px';

            (this as any)._resetZoom = false;
        }
    }
    else if (this.scaleMode === Scale.ScaleModes.RESIZE)
    {
        //  Resize to match parent
        if ((this.parentSize.width / this.parentSize.height) < (width / height)) {                    
            scaleY = scaleX;
            height = Math.round(this.parentSize.height / scaleX);     
        } else {
            scaleX = scaleY;
            width = Math.round(this.parentSize.width / scaleY);
        }

        //  This will constrain using min/max
        this.displaySize.setSize(width, height);

        this.gameSize.setSize(width, height);

        this.baseSize.setSize(width * resolution, height * resolution);

        // styleWidth = this.displaySize.width / resolution;
        // styleHeight = this.displaySize.height / resolution;
        styleWidth = this.gameSize.width;
        styleHeight = this.gameSize.height;

        if (autoRound)
        {
            styleWidth = Math.floor(styleWidth);
            styleHeight = Math.floor(styleHeight);
        }

        this.canvas.width = styleWidth;
        this.canvas.height = styleHeight;
    }
    else
    {
        if(this.scaleMode == Scale.ScaleModes.FIT) {
            if(this.parentSize.width < this.parentSize.height) {
                height = this.parentSize.width / this.gameSize.aspectRatio;
            }else{
                width = this.parentSize.height * this.gameSize.aspectRatio;
            }   
        }else if(this.scaleMode == Scale.ScaleModes.HEIGHT_CONTROLS_WIDTH) {
            width = this.parentSize.height * this.gameSize.aspectRatio;
        }else if(this.scaleMode == Scale.ScaleModes.WIDTH_CONTROLS_HEIGHT) {
            height = this.parentSize.width / this.gameSize.aspectRatio;
        }else if(this.scaleMode == Scale.ScaleModes.ENVELOP) {
            if(this.parentSize.width > this.parentSize.height) {
                height = this.parentSize.width / this.gameSize.aspectRatio;
            }else{
                width = this.parentSize.height * this.gameSize.aspectRatio;
            }  
        }
        this.displaySize.setSize(width, height);

        styleWidth = this.displaySize.width / resolution;
        styleHeight = this.displaySize.height / resolution;

        if (autoRound)
        {
            styleWidth = Math.floor(styleWidth);
            styleHeight = Math.floor(styleHeight);
        }

        style.width = styleWidth + 'px';
        style.height = styleHeight + 'px';
    }

    //  Update the parentSize in case the canvas / style change modified it
    this.getParentBounds();

    //  Finally, update the centering
    this.updateCenter();
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
    
    newx = newx * this.displayScale.x;
    newy = newy * this.displayScale.y;

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

    let x = newx / this.displayScale.x;
    let y = newy / this.displayScale.y;

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

Phaser.Scale.ScaleManager.prototype.refresh = function (previousWidth, previousHeight)
{
    if (previousWidth === undefined) { previousWidth = this.width; }
    if (previousHeight === undefined) { previousHeight = this.height; }

    this.updateScale();
    this.updateBounds();
    this.updateOrientation();

    // this.displayScale.set(this.baseSize.width / this.canvasBounds.width, this.baseSize.height / this.canvasBounds.height);
    this.displayScale.set(this.displaySize.width / this.canvasBounds.width, this.displaySize.height / this.canvasBounds.height);
    // if((this as any).__rotation) {
    //     this.displayScale.set(this.parentSize.width / this.gameSize.height, this.parentSize.height / this.gameSize.width);
    // }else{
    //     this.displayScale.set(this.parentSize.width / this.gameSize.width, this.parentSize.height / this.gameSize.height);
    // }

    var domContainer = this.game.domContainer;

    if (domContainer)
    {
        this.baseSize.setCSS(domContainer);

        var canvasStyle = this.canvas.style;
        var domStyle = domContainer.style;

        domStyle.transform = 'scale(' + this.displaySize.width / this.baseSize.width + ',' + this.displaySize.height / this.baseSize.height + ')';

        domStyle.marginLeft = canvasStyle.marginLeft;
        domStyle.marginTop = canvasStyle.marginTop;
    }

    this.emit(Phaser.Scale.Events.RESIZE, this.gameSize, this.baseSize, this.displaySize, this.resolution, previousWidth, previousHeight);

    return this;
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

    public get orientation(): Scale.Orientation {
        return this._options.orientation;
    }

    public set orientation(val: Scale.Orientation) {
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
            // //  Resize to match parent

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

        let shouldRotate = false;
        var DOMRect = scale.parent.getBoundingClientRect();
        if (scale.parentIsWindow && scale.game.device.os.iOS)
        {
            DOMRect.height = (scale as any).GetInnerHeight(true);
        }
        let pwidth = DOMRect.width;
        let pheight = DOMRect.height;
        let width = gameSize.width;
        let height = gameSize.height;

        let mat = this._canvasMatrix.identity();        
        let canvasStyle:any = canvas.style;
        canvasStyle.transformOrigin = 
            canvasStyle.webkitTransformOrigin = 
            canvasStyle.msTransformOrigin = 
            canvasStyle.mozTransformOrigin = 
            canvasStyle.oTransformOrigin = "0px 0px 0px";

        let rotDeg = 0;
        let rotate = 0;
        mat.scale(scale.displayScale);
        
        if(this._options.orientation !== null) { 
            let rotType = pwidth / pheight < 1 ? Scale.Orientation.PORTRAIT : Scale.Orientation.LANDSCAPE;
            shouldRotate = rotType != this._options.orientation;
            if(shouldRotate) {
                [pwidth, pheight] = [pheight, pwidth];
                [width, height] = [height, width];
            }

            if(shouldRotate) {
                let offset = this._getOffsetXY(gameSize.height, gameSize.width, pwidth, pheight);

                if(this._options.orientation == Scale.Orientation.LANDSCAPE) {
                    rotate = 90;
                    rotDeg = Math.PI / 2;
                    mat.rotate(rotDeg);
                    // mat.translate(new Vector2(0, -offset.y));   
                    mat.translate(new Vector2(0, -height));   
                }else{
                    rotate = -90;
                    rotDeg = -Math.PI / 2;
                    mat.rotate(rotDeg);
                    // mat.translate(new Vector2(-offset.x, 0)); 
                    mat.translate(new Vector2(-width, 0));
                }
            }
        }  
            
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
        // scale.gameSize.setSize(width, height);
        scale.setParentSize(pwidth, pheight);
        scale.emit('orientation_resize', gameSize.width, gameSize.height, rotDeg);
    }

    private _formatData(value: number): number {
        if (Math.abs(value) < 0.000001) return 0;
        if (Math.abs(1 - value) < 0.001) return value > 0 ? 1 : -1;
        return value;
    }
}