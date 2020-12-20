import { View } from "../core/View";
import { ViewScene } from "../core/ViewScene";
import { Graphics } from "../phaser";
import { Shape } from "../shapes/Shape";
import { ISerializeFields } from "../types";
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

    _shape: Shape;

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

    public hitTest(area: any, x: number, y: number) {
        if(!this._shape) {
            return super.hitTest(area, x, y);
        }
        return this._shape.contains(this, x, y);
    }

    public get shape(): Shape {
        return this._shape;
    }

    public set shape(val: Shape) {
        this._shape = val;
    }

    public draw(shape?: Shape) {
        this._updateGraph(shape);
    }
    
    private _updateGraph(shape?: Shape): void {
        this._shape = shape || this._shape;
        if (!this._shape) {
            return;
        }

        var gr: Graphics = this._graphics;
        gr.clear();

        var w: number = this.width;
        var h: number = this.height;
        if (w == 0 || h == 0)
            return;

        this._shape.draw(this, gr);
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

        this._updateGraph();  
    }

    protected fromConfig(config: any, tpl?:any) {
        super.fromConfig(config, tpl);
        
        this._updateGraph();  
    }
}