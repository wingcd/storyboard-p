import { EDirectionType } from "../core/Defines";
import { IView, IViewConfig } from ".";

export const enum EFillType {
    None,
    Horizontal,
    Vertical,
    Rotate90,
    Rotate180,
    Rotate360,
}

export interface IFillMask {
    fillType?: EFillType;
    value?: number;
    origin?: EDirectionType;
    anticlockwise?: boolean;
    outterRadius?: number;
    innerRadius?: number;
}

export enum ETextureScaleType {
    None,
    Tile,
    NinePatch,    
}

export interface ITileInfo {
    scaleX?: number;
    scaleY?: number;
}

export interface INinePatchInfo {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;

    stretchMode?: number | {
        edge: number, // 'scale', or 1, 'repeat'
        internal: number, // 'scale', or 1, 'repeat'
    };
}

export interface IUIImageConfig extends IViewConfig {
    textureKey: string;
    textureFrame?: string | number;
    scaleType?: ETextureScaleType;
    tile?: ITileInfo;
    ninePatch?: INinePatchInfo;  

    flipX?: boolean;
    flipY?: boolean;
    fillMask?: IFillMask;
}

export interface IUIImage extends IUIImageConfig, IView{

}