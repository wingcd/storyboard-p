import { IView } from "..";
import { ITextStyle } from "../../phaser";
import { IViewConfig } from "../IView";

export interface ITextFieldConfig extends IViewConfig{
    text?: string;
    style?: ITextStyle;
}

export interface ITextField extends ITextFieldConfig, IView{
}