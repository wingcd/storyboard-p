import { IView } from ".";
import { ISelectable, IIcon } from "./ViewTypes";
import { ITileInfo } from "./IUIImage";

export interface IUIButtonConfig{
}

export interface IUIButton extends IUIButtonConfig, IView, ISelectable, IIcon, ITileInfo{

}