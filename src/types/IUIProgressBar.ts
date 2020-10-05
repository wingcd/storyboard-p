import { IViewGroupConfig } from "./IViewGroup";

export enum EProgressTitleType {
    Percent,
    ValueAndMax,
    Value,
    Custom,
}

export interface IUIProgressBarConfig extends IViewGroupConfig {
    titleType?: EProgressTitleType;
}

export interface IUIProgressBar extends IUIProgressBarConfig{

}