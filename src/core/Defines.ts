import { Easing } from "../phaser";

export const TOP_MOST_DEPTH = 99999;
export const DEFAULT_DEPTH = 0;

export enum EResourceType { 
    None,
    Txt,
    Json,
    Image,
    Audio,
    Video,
};

export enum ECategoryType { 
    None,
    View,
    Property,
    Animation,    
};

export enum EDirectionType {
    None = 0,
    Left = 1,
    Top = 1 << 1,
    Right = 1 << 2,
    Bottom = 1 << 3,    
}

export enum EDirtyType {
    None = 0,
    ChildChanged = 1,
    BoundsChanged = 1 << 1,
    FrameChanged = 1 << 2,
    BorderChanged = 1 << 3,

    DebugBoundsChanged = 1 << 5,
    DebugFrameChanged = 1 << 6,
    DebugBorderChanged = 1 << 7,
}

export enum EOverflowType { Visible, Hidden, Scroll, Scale, ScaleFree };
export enum EScrollType { Horizontal, Vertical, Both };
export enum EDragType { Horizontal, Vertical, Both };
export enum EVertAlignType { Top, Middle, Bottom };
export enum EHorAlignType { Left, Center, Right };
export enum EAutoSizeType { None, Both, Width, Height, Shrink };
export enum EAlignType { 
                        Left = "left", Center = "center", Right = "right", 
                        Top = "top", Middle = "middle", Bottom = "bottom", 
                        Justify = "justify"
                    };

let easeMap: ((t: number) => number)[] = [
    null,
    Easing.Linear,
    Easing.Stepped,
    Easing.Elastic.In,
    Easing.Elastic.Out,
    Easing.Elastic.InOut,
    Easing.Quadratic.In,
    Easing.Quadratic.Out,
    Easing.Quadratic.InOut,
    Easing.Cubic.In,
    Easing.Cubic.Out,
    Easing.Cubic.InOut,
    Easing.Quartic.In,
    Easing.Quartic.Out,
    Easing.Quartic.InOut,
    Easing.Quintic.In,
    Easing.Quintic.Out,
    Easing.Quintic.InOut,
    Easing.Sine.In,
    Easing.Sine.Out,
    Easing.Sine.InOut,    
    Easing.Bounce.In,
    Easing.Bounce.Out,
    Easing.Bounce.InOut,    
    Easing.Circular.In,
    Easing.Circular.Out,
    Easing.Circular.InOut,
    Easing.Expo.In,
    Easing.Expo.Out,
    Easing.Expo.InOut,
    Easing.Back.In,
    Easing.Back.Out,
    Easing.Back.InOut,
];

export enum EEaseType {
    Known,
    Linear,
    Stepped,
    Elastic_In,
    Elastic_Out,
    Elastic_InOut,
    Quad_In,
    Quad_Out,
    Quad_InOut,
    Cube_In,
    Cube_Out,
    Cube_InOut,
    Quart_In,
    Quart_Out,
    Quart_InOut,
    Quint_In,
    Quint_Out,
    Quint_InOut,
    Sine_In,
    Sine_Out,
    Sine_InOut,
    Bounce_In,
    Bounce_Out,
    Bounce_InOut,
    Circ_In,
    Circ_Out,
    Circ_InOut,
    Expo_In,
    Expo_Out,
    Expo_InOut,
    Back_In,
    Back_Out,
    Back_InOut,
}

export function ParseEaseType(easeType: EEaseType): (t: number) => number {
    return easeMap[easeType];
}