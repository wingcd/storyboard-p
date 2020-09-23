import { IView } from ".";
import { ISelectable, IIcon } from "./ViewTypes";
import { ITileInfo } from "./IUIImage";
import { IViewGroupConfig } from "./IViewGroup";

export const enum EButtonMode { Common, Check, Radio };

export interface IUIButtonConfig extends IViewGroupConfig, ISelectable, IIcon, ITileInfo{
    title?: string;
    titleColor?: number;
    mode?: EButtonMode;
}

export interface IUIButton extends IUIButtonConfig{

}