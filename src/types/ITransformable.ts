import { Point, Rectangle } from "../phaser";

export interface ITransformable {    
    localToGlobal(ax?: number, ay?: number, resultPoint?: Point): Point;
    globalToLocal(ax?: number, ay?: number, resultPoint?: Point): Point;
    localToGlobalRect(ax?: number, ay?: number, aWidth?: number, aHeight?: number, resultRect?: Rectangle): Rectangle;
    globalToLocalRect(ax?: number, ay?: number, aWidth?: number, aHeight?: number, resultRect?: Rectangle): Rectangle;
    localToDOM(ax?: number, ay?: number, resultPoint?: Point): Point;
    domToLocal(ax?: number, ay?: number, resultPoint?: Point): Point;
    localToDOMRect(ax?: number, ay?: number, aWidth?: number, aHeight?: number, resultRect?: Rectangle): Rectangle;
    domToLocalRect(ax?: number, ay?: number, aWidth?: number, aHeight?: number, resultRect?: Rectangle): Rectangle;  
}