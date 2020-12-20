import { ECategoryType } from "../core/Defines";
import { Package } from "../core/Package";
import { Graphics, Rectangle } from "../phaser";
import { ISerializeFields, IView } from "../types";
import { IShape } from "../types/IShape";
import { splitColorAndAlpha } from "../utils/Color";
import { GetValue } from "../utils/Object";
import { Deserialize, Serialize } from "../utils/Serialize";
import { ShapeFactory } from "./ShapeFactory";

export enum EShapeShowType {
    None,
    Line,
    Fill,
    All,
}

export class Shape implements IShape{    
    public static CATEGORY = ECategoryType.Shape;
    public static TYPE = "";
    public static MIN_HITTEST_SIZE = 5;

    static SERIALIZABLE_FIELDS: ISerializeFields = {
        CATEGORY: {alias: "__category__", static: true, readOnly: true},
        TYPE: {alias: "__type__", static: true, readOnly: true, must: true}, 
        resourceUrl: {},

        showType: {property: "_cornerRadius", default: EShapeShowType.All},
        lineSize: {default: 1},  
        lineColor: {default: 0},  
        fillColor: {default: 0xffffff},
    };   

    static DESERIALIZE(config: any, target: IView, configProp: string, targetProp: string, tpl: any, index?: number) {
        return [ShapeFactory.inst.create(config, tpl), false];
    }
    
    public resourceUrl?: string;
    public showType: EShapeShowType = EShapeShowType.All;
    public lineSize?: number;
    public fillColor?: number;  
    public lineColor?: number;  

    private _inBuilding = false; 
    protected _shape: any;

    constructor(config?: any) {
        this.showType = GetValue(config, "showType", EShapeShowType.All);
        this.lineSize = GetValue(config, "lineSize", 1);
        this.lineColor = GetValue(config, "lineColor", 0x0);
        this.fillColor = GetValue(config, "fillColor", 0xffffff);
    }

    protected fromConfig(config: any, tpl?:any) {
        this._inBuilding = false;
    }

    public get inBuilding(): boolean {
        return this._inBuilding;
    }
    
    public toJSON(tpl?: any, ignores?: string[]): any {
        let temp = null;
        if(this.resourceUrl) {
            temp = Package.inst.getTemplateFromUrl(this.resourceUrl);
        }
        return Serialize(this, temp || tpl, ignores);
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            this._inBuilding = true;
            Deserialize(this, config, template);
        }

        return this;
    }

    contains(view: IView, x:number, y: number): boolean {
        return Rectangle.Contains(this._shape, x, y);
    }  

    protected reset(view: IView, g: Graphics) {
        this._shape = new Rectangle(0, 0, Math.min(Shape.MIN_HITTEST_SIZE, view.width), Math.min(Shape.MIN_HITTEST_SIZE, view.height));
    } 

    protected needFill(): boolean {
        return this.showType == EShapeShowType.Fill || this.showType == EShapeShowType.All;
    }

    protected needLine(): boolean {
        return this.showType == EShapeShowType.Line || this.showType == EShapeShowType.All;
    }

    protected config(view: IView, g: Graphics) {
        if(this.needFill()) {
            let lColor = splitColorAndAlpha(this.lineColor);
            g.lineStyle(this.lineSize, lColor[0], lColor[1]);
        }
        if(this.needLine()) {
            let fcolor = splitColorAndAlpha(this.fillColor);
            g.fillStyle(fcolor[0], fcolor[1]);
        }
    }

    public get shape(): any {
        return this._shape;
    }

    public fill(view: IView, g: Graphics): this {
        return this;
    }

    public storke(view: IView, g: Graphics): this {
        return this;
    }
    
    public draw(view: IView, g: Graphics): this {        
        if(this.showType  == EShapeShowType.None) {
            return this;
        }
        this.reset(view, g);
        this.config(view, g);
        this.fill(view, g);
        this.storke(view, g);
        return this;
    }
}