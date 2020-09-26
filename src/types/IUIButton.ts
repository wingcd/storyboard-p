import { IView } from ".";
import { ISelectable, IIcon, ITitle } from "./ViewTypes";
import { ITileInfo } from "./IUIImage";
import { IViewGroupConfig } from "./IViewGroup";

export const enum EButtonMode { Common, Check, Radio };

export interface IUIButtonConfig extends IViewGroupConfig, ISelectable, IIcon, ITileInfo, ITitle{
    mode?: EButtonMode;
}

export interface IUIButton extends IUIButtonConfig{

}