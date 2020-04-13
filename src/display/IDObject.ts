import { View } from "../core/View";

export interface IUIView {
    owner: View; 
}    

export function IsDObject(obj: any): obj is IUIView {
    return obj && "owner" in obj && obj.owner != null;
}

export function GetSObject(obj: any): View {
    if(IsDObject(obj)) {
        return obj.owner;
    }
    return null;
}