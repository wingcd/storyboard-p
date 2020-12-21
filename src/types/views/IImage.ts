import { EDirectionType, EFillType, ETextureScaleType, } from "../../core/Defines";
import { IViewConfig } from "../IView";

export interface IFillMask {
    fillType?: EFillType;
    value?: number;
    origin?: EDirectionType;
    anticlockwise?: boolean;
    outterRadius?: number;
    innerRadius?: number;
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

export interface IImageConfig extends IViewConfig {
    textureKey: string;
    textureFrame?: string | number;
    scaleType?: ETextureScaleType;
    tile?: ITileInfo;
    ninePatch?: INinePatchInfo;  

    flipX?: boolean;
    flipY?: boolean;
    fillMask?: IFillMask;
}

export interface IImage extends IImageConfig {

}