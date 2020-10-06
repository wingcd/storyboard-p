import { IView } from ".";
import { ITextStyle } from "../phaser";
import { IViewConfig } from "./IView";

export interface IUITextFieldConfig extends IViewConfig{
    text?: string;
    style?: ITextStyle;
}

export interface IUITextField extends IUITextFieldConfig, IView{
}