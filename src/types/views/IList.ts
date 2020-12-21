import { IViewGroup, IViewGroupConfig } from "../IViewGroup";

export interface IListConfig extends IViewGroupConfig {
    columnGap?: number;
    lineGap?: number;
}

export interface IList extends IViewGroup, IListConfig{

}