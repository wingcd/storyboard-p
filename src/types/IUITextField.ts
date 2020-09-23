import { IView } from ".";
import { IViewConfig } from "./IView";

export interface IUITextFieldConfig extends IViewConfig{
    text?: string;
}

export interface IUITextField extends IUITextFieldConfig, IView{
}