import { EProgressTitleType } from "../../core/Defines";
import { IViewGroupConfig } from "../IViewGroup";

export interface IProgressBarConfig extends IViewGroupConfig {
    titleType?: EProgressTitleType;
}

export interface IProgressBar extends IProgressBarConfig{

}