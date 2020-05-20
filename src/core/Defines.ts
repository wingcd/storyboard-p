export const TOP_MOST_DEPTH = 99999;
export const DEFAULT_DEPTH = 0;

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