import { IView } from ".";
import { ISelectable, IIcon, ITitle } from "./ViewTypes";
import { ITileInfo } from "./IUIImage";
import { IViewGroupConfig } from "./IViewGroup";

export interface IUILabelCOnfig extends IViewGroupConfig, ISelectable, IIcon, ITileInfo, ITitle{
    editable?: boolean;
}

export interface IUILabel extends IUILabelCOnfig{

}