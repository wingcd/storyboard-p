import { GameObjectFactoryExt } from "../phaser";
import { ViewManager } from "../core/ViewManager";
import { IViewRoot } from ".";
import { ViewFactory } from "../core/ViewFactory";

export interface IViewSceneConfig {
}

export interface IViewScene extends IViewSceneConfig {
    addExt: GameObjectFactoryExt;
    ui: ViewManager;
    root: IViewRoot;
    addUI: ViewFactory;
    makeUI: ViewFactory;
}