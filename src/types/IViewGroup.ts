import { EOverflowType } from "../core/Defines";
import { IView } from ".";
import { Container } from "../phaser";

export interface IViewGroupConfig {
    overflowType?: EOverflowType;

    children?: IView[];
}

export interface IViewGroup extends IView, IViewGroupConfig{
    container: Container;
    numChildren: number;
    
    ensureBoundsCorrect(): this;
    setChildIndex(child: IView, index?: number): number;
    setChildIndexBefore(child: IView, index: number): number;
    childStateChanged(child: IView): this;
    addChild(child: IView): this;
    addChildAt(child: IView, index?: number): this;
    removeAllChildren(dispose?: boolean, toPool?: boolean): this;
    removeChild(child: IView, dispose?: boolean, toPool?: boolean): IView;
    removeChildAt(index: number, dispose?: boolean, toPool?: boolean): IView;
    getChildAt(index?: number): IView;
    getChild(name: string): IView;
    getChildIndex(child: IView): number;
    getChildById(id: string): IView;

    appendChildrenList(): void;
}