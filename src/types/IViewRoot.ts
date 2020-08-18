import { IView } from "./IView";
import { IViewGroup } from "./IViewGroup";

export interface IViewRootConfig {
    
}

export interface IViewRoot extends IViewGroup, IViewRootConfig {
    focus: IView;
}