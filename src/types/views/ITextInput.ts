import { ITextFieldConfig, ITextField } from "./ITextField";

export interface ITextInputConfig extends ITextFieldConfig{
}

export interface ITextInput extends ITextInputConfig, ITextField{

}