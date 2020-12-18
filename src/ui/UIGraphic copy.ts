import { View } from "../core/View";
import { ViewScene } from "../core/ViewScene";
import { Graphics, Point } from "../phaser";
import { ISerializeFields } from "../types";
import { splitColorAndAlpha } from "../utils/Color";
import { MathUtils } from "../utils/Math";
import { clone } from "../utils/Serialize";

export class UIGraphic extends View {
    static TYPE = "graphic";
    
    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        clone(View.SERIALIZABLE_FIELDS),
        {
            type: {property: "_type", default: 0},
            lineSize: {property: "_lineSize", default: 1},  
            lineColor: {property: "_lineColor", default: 0},  
            fillColor: {property: "_fillColor", default: 0xffffff},
            cornerRadius: {property: "_cornerRadius", raw: true},
            sides: {property: "_sides"},
            startAngle: {property: "_startAngle"},
            polygonPoints: {property: "_polygonPoints", raw: true},    
            distances: {property: "_distances", raw: true},           
        }
    );

    private _type: number = 0;
    private _lineSize: number = 1;
    private _lineColor: number = 0;
    private _fillColor: number = 0xffffff;

    private _cornerRadius?: number|number[];

    private _sides?: number;
    private _startAngle?: number;
    private _polygonPoints?: number[];
    private _distances?: number[];

    private _graphics: Graphics;

    constructor(scene: ViewScene) {
        super(scene);
    }

    protected bind(scene: ViewScene): boolean {
        let ret = super.bind(scene);

        if(ret) {
            this._graphics = scene.add.graphics();
            this.setDisplayObject(this._graphics);
        }
        return ret;
    }

    public drawRect(lineSize: number, lineColor: number, fillColor: number, cornerRadius?: number|number[]): void {
        this._type = 1;
        this._lineSize = lineSize;
        this._lineColor = lineColor;
        this._fillColor = fillColor;
        this._cornerRadius = cornerRadius;
        this._updateGraph();
    }

    public drawEllipse(lineSize: number, lineColor: number, fillColor: number): void {
        this._type = 2;
        this._lineSize = lineSize;
        this._lineColor = lineColor;
        this._fillColor = fillColor;
        this._updateGraph();
    }

    public drawRegularPolygon(lineSize: number, lineColor: number, fillColor: number, sides: number, startAngle?: number, distances?: number[]): void {
        this._type = 4;
        this._lineSize = lineSize;
        this._lineColor = lineColor;
        this._fillColor = fillColor;
        this._sides = sides;
        this._startAngle = startAngle || 0;
        this._distances = distances;
        this._updateGraph();
    }

    public drawPolygon(lineSize: number, lineColor: number, fillColor: number, points: number[]): void {
        this._type = 3;
        this._lineSize = lineSize;
        this._lineColor = lineColor;
        this._fillColor = fillColor;
        this._polygonPoints = points;
        this._updateGraph();
    }

    public get distances(): number[] {
        return this._distances;
    }

    public set distances(value: number[]) {
        if(this._distances != value) {
            this._distances = value;
            if (this._type == 3)
                this._updateGraph();
        }
    }

    public get fillColor(): number {
        return this._fillColor;
    }

    public set fillColor(value: number) {
        if(this._fillColor != value) {
            this._fillColor = value;
            this._updateGraph();   
        }         
    }

    public get lineSize(): number {
        return this._lineSize;
    }

    public set lineSize(val: number) {
        if(val != this._lineSize) {
            this._lineSize = val;
            this._updateGraph();
        }
    }

    public get lineColor(): number {
        return this._lineColor;
    }

    public set lineColor(value: number) {
        if(this._lineColor != value) {
            this._lineColor = value;
            this._updateGraph();   
        }         
    }

    public get cornerRadius(): number|number[] {
        return this._cornerRadius;
    }

    public set cornerRadius(val: number|number[]) {
        if(val != this._cornerRadius) {
            this._cornerRadius = val;
            if(this._type == 1) {
                this._updateGraph();
            }
        }
    }

    public get sides(): number {
        return this._sides;
    }

    public set sides(val: number) {
        if(val != this._sides) {
            this._sides = val;
            if(this._type == 4) {
                this._updateGraph();
            }
        }
    }

    public get startAngle(): number {
        return this._startAngle;
    }

    public set startAngle(val: number) {
        if(val != this._startAngle) {
            this._startAngle = val;
            if(this._type == 4) {
                this._updateGraph();
            }
        }
    }

    private _updateGraph(): void {
        if (this._type == 0) {
            return;
        }

        var gr: Graphics = this._graphics;
        gr.clear();

        var w: number = this.width;
        var h: number = this.height;
        if (w == 0 || h == 0)
            return;

        var fillColor: number = this._fillColor;
        var fillAlpah = 1;
        var lineColor: number = this._lineColor;
        var lineAlpha = 1;
        if (fillColor > 0xffffff) {
            let colors = splitColorAndAlpha(fillColor);
            fillColor = colors[0];
            fillAlpah = colors[1];
        }
        if (lineColor > 0xffffff) {
            let colors = splitColorAndAlpha(lineColor);
            lineColor = colors[0];
            lineAlpha = colors[1];
        }
        gr.fillStyle(fillColor, fillAlpah);
        gr.lineStyle(this._lineSize, lineColor, lineAlpha);

        if (this._type == 1) {
            if (this._cornerRadius) {
                if(Array.isArray(this._cornerRadius)) {
                    gr.fillRoundedRect(0, 0, w, h, {tl:this._cornerRadius[0], tr: this._cornerRadius[1], bl: this._cornerRadius[2], br: this._cornerRadius[3]});
                    gr.strokeRoundedRect(0, 0, w, h, {tl:this._cornerRadius[0], tr: this._cornerRadius[1], bl: this._cornerRadius[2], br: this._cornerRadius[3]})
                }else{
                    gr.fillRoundedRect(0, 0, w, h, this._cornerRadius);
                    gr.strokeRoundedRect(0, 0, w, h, this._cornerRadius)
                }
            }
            else {
                gr.fillRoundedRect(0, 0, w, h, 0);
                gr.strokeRoundedRect(0, 0, w, h, 0)
            }
        } else if (this._type == 2) {
            if(w == h) {
                gr.fillCircle(w / 2, h / 2, w / 2);
                gr.strokeCircle(w / 2, h / 2, w / 2);
            }else{
                gr.fillEllipse(w / 2, h / 2, w, h);
                gr.strokeEllipse(w / 2, h / 2, w, h);
            }
        }
        else if (this._type == 3) {
            let points: Point[] = [];
            if(this._polygonPoints) {
                if(this._polygonPoints.length % 2 > 1) {
                    throw "error points count";
                }
                for(let i=0;i<this._polygonPoints.length;i+=2){
                    points.push(new Point(this._polygonPoints[i], this._polygonPoints[i+1]));
                }
            }
            gr.fillPoints(points, true, true);
            gr.strokePoints(points, true, true);
        }
        else if (this._type == 4) {
            if (!this._polygonPoints)
                this._polygonPoints = [];
            var sides = this._sides || 3;
            var startAngle = this._startAngle || 0;
            var radius: number = Math.min(this.width, this.height) / 2;
            this._polygonPoints.length = 0;
            var angle: number = MathUtils.angleToRadian(startAngle);
            var deltaAngle: number = 2 * Math.PI / sides;
            var dist: number;
            for (var i: number = 0; i < sides; i++) {
                if (this._distances) {
                    dist = this._distances[i];
                    if (isNaN(dist))
                        dist = 1;
                }
                else
                    dist = 1;

                var xv: number = radius + radius * dist * Math.cos(angle);
                var yv: number = radius + radius * dist * Math.sin(angle);
                this._polygonPoints.push(xv, yv);

                angle += deltaAngle;
            }
            
            let points: Point[] = [];
            if(this._polygonPoints) {
                for(let i=0;i<this._polygonPoints.length;i+=2){
                    points.push(new Point(this._polygonPoints[i], this._polygonPoints[i+1]));
                }
            }
            gr.fillPoints(points, true, true);
            gr.strokePoints(points, true, true);
        }
    }

    public replaceMe(target: View): void {
        if (!this.parent)
            throw "parent not set";

        target.name = this.name;
        target.alpha = this.alpha;
        target.angle = this.angle;
        target.visible = this.visible;
        target.touchable = this.touchable;
        target.grayed = this.grayed;
        target.setXY(this.x, this.y);
        target.setSize(this.width, this.height);

        var index: number = this.parent.getChildIndex(this);
        this.parent.addChildAt(target, index);
        target.relations.fromJSON(this.relations.toJSON());

        this.parent.removeChild(this, true);
    }

    public addBeforeMe(target: View): void {
        if (!this.parent)
            throw "parent not set";

            // Phaser.Geom.TR

        var index: number = this.parent.getChildIndex(this);
        this.parent.addChildAt(target, index);
    }

    public addAfterMe(target: View): void {
        if (!this.parent)
            throw "parent not set";

        var index: number = this.parent.getChildIndex(this);
        index++;
        this.parent.addChildAt(target, index);
    }

    protected handleSizeChanged(): void {
        super.handleSizeChanged();

        this._updateGraph();  
    }

    protected fromConfig(config: any, tpl?:any) {
        super.fromConfig(config, tpl);
        
        this._updateGraph();  
    }
}