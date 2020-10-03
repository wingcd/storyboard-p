import { IIcon, ITitle } from "./ViewTypes";
import { IViewGroupConfig } from "./IViewGroup";

export interface IUILabelConfig extends IViewGroupConfig, IIcon, ITitle{
    editable?: boolean;
}

export interface IUILabel extends IUILabelConfig{

}