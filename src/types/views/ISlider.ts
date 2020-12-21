import { EProgressTitleType } from "../../core/Defines";
import { IViewGroupConfig } from "../IViewGroup";

export interface ISliderConfig extends IViewGroupConfig {
    titleType?: EProgressTitleType;
}

export interface ISlider extends ISliderConfig{

}