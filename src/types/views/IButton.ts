import { ISelectable, IIcon, ITitle } from "../ViewTypes";
import { ITileInfo } from "./IImage";
import { IViewGroupConfig } from "../IViewGroup";
import { EButtonMode } from "../../core/Defines";

export interface IButtonConfig extends IViewGroupConfig, ISelectable, IIcon, ITileInfo, ITitle{
    mode?: EButtonMode;
}

export interface IButton extends IButtonConfig{

}