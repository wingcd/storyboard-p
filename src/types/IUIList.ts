import { IViewGroup, IViewGroupConfig } from "./IViewGroup";

export interface IUIListConfig extends IViewGroupConfig {
    columnGap?: number;
    lineGap?: number;
}

export interface IUIList extends IViewGroup, IUIListConfig{

}