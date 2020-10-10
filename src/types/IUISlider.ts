import { EProgressTitleType } from "../core/Defines";
import { IViewGroupConfig } from "./IViewGroup";

export interface IUISliderConfig extends IViewGroupConfig {
    titleType?: EProgressTitleType;
}

export interface IUISlider extends IUISliderConfig{

}