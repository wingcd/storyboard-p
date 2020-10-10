import { ISelectable, IIcon, ITitle } from "./ViewTypes";
import { ITileInfo } from "./IUIImage";
import { IViewGroupConfig } from "./IViewGroup";
import { EButtonMode } from "../core/Defines";

export interface IUIButtonConfig extends IViewGroupConfig, ISelectable, IIcon, ITileInfo, ITitle{
    mode?: EButtonMode;
}

export interface IUIButton extends IUIButtonConfig{

}