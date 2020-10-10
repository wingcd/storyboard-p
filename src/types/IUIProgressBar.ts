import { EProgressTitleType } from "../core/Defines";
import { IViewGroupConfig } from "./IViewGroup";

export interface IUIProgressBarConfig extends IViewGroupConfig {
    titleType?: EProgressTitleType;
}

export interface IUIProgressBar extends IUIProgressBarConfig{

}