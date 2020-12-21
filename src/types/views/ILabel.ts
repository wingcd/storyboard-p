import { IIcon, ITitle } from "../ViewTypes";
import { IViewGroupConfig } from "../IViewGroup";

export interface ILabelConfig extends IViewGroupConfig, IIcon, ITitle{
    editable?: boolean;
}

export interface ILabel extends ILabelConfig{

}