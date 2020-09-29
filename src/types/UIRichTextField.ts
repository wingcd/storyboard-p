import { IUITextFieldConfig, IUITextField } from "./IUITextField";

export interface IUIRichTextInputConfig extends IUITextFieldConfig{
}

export interface UIRichTextField extends IUIRichTextInputConfig, IUITextField{

}