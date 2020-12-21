import { ITextFieldConfig, ITextField } from "./ITextField";

export interface IRichTextInputConfig extends ITextFieldConfig{
}

export interface IRichTextField extends IRichTextInputConfig, ITextField{

}