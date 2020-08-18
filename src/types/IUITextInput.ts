import { IUITextFieldConfig, IUITextField } from "./IUITextField";

export interface IUITextInputConfig extends IUITextFieldConfig{
}

export interface IUITextInput extends IUITextInputConfig, IUITextField{

}