import Size = Phaser.Structs.Size;
import Matrix3 = Phaser.Math.Matrix3;
import Vector2 = Phaser.Math.Vector2;
import Scale = Phaser.Scale;

export const enum EOrientation {
    AUTO,
    PORTRAIT,
    LANDSCAPE,
}

export interface IStageOptions {
    orientation?: EOrientation;
    [key: string]: string | number;
}

export class DefaultStageOptions {
    orientation?: EOrientation = EOrientation.AUTO;
    [key: string]: string | number;
}

type BoundingRect = {
    x: number,
    y: number,
    width: number,
    height: number
};

interface IBoundingRectCalculator {
    getRect(view:HTMLCanvasElement, fallbackWidth:number, fallbackHeight:number):BoundingRect;
}

class DefaultBoudingRectCalculator implements IBoundingRectCalculator {
    public getRect(view:HTMLCanvasElement, fallbackWidth:number, fallbackHeight:number): BoundingRect {
        let p = view.parentElement;
        if(!p)
            //this should be impossible situation unless the user forget to append the view into the DOM.
            throw new Error("Your view of PIXI are still in memory but not appended to DOM yet? it's necessary that there is a parent element to wrap your view up.");
        let rect = p.getBoundingClientRect();
        let ret:BoundingRect = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
        if(!rect || rect.width <= 0 || rect.height <= 0) {
            console.warn("It seems that you did not set a explicit size for the parent element of your view, now fall back to window size instead.");
            ret.width = window.innerWidth;
            ret.height = window.innerHeight;
            ret.x = 0;
            ret.y = 0;
        }
        else {
            ret.x = rect.left;
            ret.y = rect.top;
            ret.width = rect.width;
            ret.height = rect.height;
        }

        //consider the worst situation: window does not have size!!
        if(ret.width <= 0 || ret.height <= 0) {
            console.warn("fetch container size to initialize PIXI in all ways have failed, now use default size (fallbackWidth / fallbackHeight) specified in the options instead.");
            ret.width = fallbackWidth;
            ret.height = fallbackHeight;
        }

        return ret;
    }
}

Scale.ScaleManager.prototype.updateScale = function ()
{
    var style = this.canvas.style;

    var width = this.gameSize.width;
    var height = this.gameSize.height;

    var styleWidth;
    var styleHeight;

    var zoom = this.zoom;
    var autoRound = this.autoRound;
    var resolution = 1;

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

        //  This will constrain using min/max
        this.displaySize.setSize(this.parentSize.width, this.parentSize.height);

        this.gameSize.setSize(this.displaySize.width, this.displaySize.height);

        this.baseSize.setSize(this.displaySize.width * resolution, this.displaySize.height * resolution);

        styleWidth = this.displaySize.width / resolution;
        styleHeight = this.displaySize.height / resolution;

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
        //  All other scale modes
        this.displaySize.setSize(this.parentSize.width, this.parentSize.height);

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

export class OrientationPlugin extends Phaser.Plugins.BasePlugin {
    private _options: IStageOptions;
    protected _canvasMatrix: Matrix3 = new Matrix3();
    private _baseSize: Size;
    
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
        this._baseSize = this.game.scale.baseSize;
    }

    private _sizeChanged(gameSize:Size, baseSize: Size, displaySize: Size, resolution: number, previousWidth: number, previousHeight: number) {
        if((this.game.scale as any).___locked) {
            (this.game.scale as any).___locked = false;
            return;
        }

        let width = gameSize.width;
        let height = gameSize.height;

        let shouldRotate = false;
        if(this._options.orientation !== EOrientation.AUTO) {
            let rotType = width / height < 1 ? EOrientation.PORTRAIT : EOrientation.LANDSCAPE;
            shouldRotate = rotType != this._options.orientation;
            if(shouldRotate) {
                [width, height] = [height, width];
            }

            let rotate = 0;
            if(shouldRotate) {
                if(this._options.orientation == EOrientation.LANDSCAPE) {
                    rotate = 90;    
                }else{
                    rotate = -90;
                }

            }
        }

        let mat = this._canvasMatrix.identity();
        let canvas = this.game.canvas;
        let scale = this.game.scale;
        // mat.scale(scale.displayScale);

        let rotDeg = 0;
        let rotate = 0;
        if(shouldRotate) {
            if(this._options.orientation == EOrientation.LANDSCAPE) {
                rotate = 90;
                rotDeg = Math.PI / 2;
                mat.rotate(rotDeg);
                mat.translate(new Vector2(0, -height));                
            }else{
                rotate = -90;
                rotDeg = -Math.PI / 2;
                mat.rotate(rotDeg);
                mat.translate(new Vector2(-width, 0));
            }
        }

        // https://www.cnblogs.com/wen-k-s/p/11375356.html
        mat.val[0] = this._formatData(mat.val[0]); //a
        mat.val[4] = this._formatData(mat.val[4]); //d
        mat.val[6] = this._formatData(mat.val[6]); //tx
        mat.val[7] = this._formatData(mat.val[7]); //ty

        let canvasStyle:any = canvas.style;
        canvasStyle.transformOrigin = 
            canvasStyle.webkitTransformOrigin = 
            canvasStyle.msTransformOrigin = 
            canvasStyle.mozTransformOrigin = 
            canvasStyle.oTransformOrigin = "0px 0px 0px";
        canvasStyle.transform = 
            canvasStyle.webkitTransform = 
            canvasStyle.msTransform = 
            canvasStyle.mozTransform = 
            canvasStyle.oTransform = `matrix(${mat.val[0]},${mat.val[1]},${mat.val[3]},${mat.val[4]},${mat.val[6]},${mat.val[7]})`;  

        if(shouldRotate) {
            // canvasStyle.width = `${width}px`;
            // canvasStyle.height = `${height}px`;
            // canvas.width = width;
            // canvas.height = height;

            (this.game.scale as any).___locked = true;
            this.game.scale.baseSize.setSize(this._baseSize.height, this._baseSize.width);
            this.game.scale.setGameSize(width, height);
            this.game.scale.emit('user_resize', width, height);
        }else{
            this.game.scale.baseSize.setSize(this._baseSize.width, this._baseSize.height);
        }
    }

    private _formatData(value: number): number {
        if (Math.abs(value) < 0.000001) return 0;
        if (Math.abs(1 - value) < 0.001) return value > 0 ? 1 : -1;
        return value;
    }
}