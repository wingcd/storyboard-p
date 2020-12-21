import { View } from "./View";

interface IView {
    owner: View; 
}    

export function IsDObject(obj: any): obj is IView {
    return obj && "owner" in obj && obj.owner != null;
}

export function GetSObject(obj: any): View {
    if(IsDObject(obj)) {
        return obj.owner;
    }
    return null;
}