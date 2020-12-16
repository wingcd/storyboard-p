import { View } from "../core/View";
import { ViewScene } from "../core/ViewScene";
import { Graphics, Point } from "../phaser";
import { splitColorAndAlpha } from "../utils/Color";
import { MathUtils } from "../utils/Math";

export class UIGraph extends View {
    static TYPE = "graph";

    private _type: number;
    private _lineSize: number;
    private _lineColor: number;
    private _fillColor: number;
    private _cornerRadius?: number|number[];
    private _sides?: number;
    private _startAngle?: number;
    private _polygonPoints?: Point[];
    private _distances?: number[];
    private _graphics: Graphics;

    constructor(scene: ViewScene) {
        super(scene);

        this._type = 0;
        this._lineSize = 1;
        this._lineColor = 0x0;
        this._fillColor = 0xffffff;
        this._graphics = scene.add.graphics();
        this.setDisplayObject(this._graphics);
    }

    public drawRect(lineSize: number, lineColor: number, fillColor: number, cornerRadius?: number|number[]): void {
        this._type = 1;
        this._lineSize = lineSize;
        this._lineColor = lineColor;
        this._fillColor = fillColor;
        this._cornerRadius = cornerRadius;
        this.updateGraph();
    }

    public drawEllipse(lineSize: number, lineColor: number, fillColor: number): void {
        this._type = 2;
        this._lineSize = lineSize;
        this._lineColor = lineColor;
        this._fillColor = fillColor;
        this.updateGraph();
    }

    public drawRegularPolygon(lineSize: number, lineColor: number, fillColor: number, sides: number, startAngle?: number, distances?: number[]): void {
        this._type = 4;
        this._lineSize = lineSize;
        this._lineColor = lineColor;
        this._fillColor = fillColor;
        this._sides = sides;
        this._startAngle = startAngle || 0;
        this._distances = distances;
        this.updateGraph();
    }

    public drawPolygon(lineSize: number, lineColor: number, fillColor: number, points: number[]): void {
        this._type = 3;
        this._lineSize = lineSize;
        this._lineColor = lineColor;
        this._fillColor = fillColor;
        this._polygonPoints = [];
        if(points) {
            for(let i =0;i < points.length;i+=2) {
                this._polygonPoints.push(new Point(points[i], points[i+1]));
            }
        }
        this.updateGraph();
    }

    public get distances(): number[] {
        return this._distances;
    }

    public set distances(value: number[]) {
        this._distances = value;
        if (this._type == 3)
            this.updateGraph();
    }

    public get color(): number {
        return this._fillColor;
    }

    public set color(value: number) {
        this._fillColor = value;
        if (this._type != 0)
            this.updateGraph();
    }

    private updateGraph(): void {
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
            gr.fillPoints(this._polygonPoints, true, true);
            gr.strokePoints(this._polygonPoints, true, true);
        }
        else if (this._type == 4) {
            if (!this._polygonPoints)
                this._polygonPoints = [];
            var radius: number = Math.min(this.width, this.height) / 2;
            this._polygonPoints.length = 0;
            var angle: number = MathUtils.angleToRadian(this._startAngle);
            var deltaAngle: number = 2 * Math.PI / this._sides;
            var dist: number;
            for (var i: number = 0; i < this._sides; i++) {
                if (this._distances) {
                    dist = this._distances[i];
                    if (isNaN(dist))
                        dist = 1;
                }
                else
                    dist = 1;

                var xv: number = radius + radius * dist * Math.cos(angle);
                var yv: number = radius + radius * dist * Math.sin(angle);
                this._polygonPoints.push(new Point(xv, yv));

                angle += deltaAngle;
            }

            gr.fillPoints(this._polygonPoints, true, true);
            gr.strokePoints(this._polygonPoints, true, true);
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

        if (this._type != 0)
            this.updateGraph();
    }
}