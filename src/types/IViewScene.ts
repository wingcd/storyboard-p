import { GameObjectFactoryExt } from "../phaser";
import { UIManager } from "../core/UIManager";
import { IViewRoot } from ".";
import { ViewFactory } from "../core/ViewFactory";

export interface IViewSceneConfig {
}

export interface IViewScene extends IViewSceneConfig {
    addExt: GameObjectFactoryExt;
    ui: UIManager;
    root: IViewRoot;
    addUI: ViewFactory;
    makeUI: ViewFactory;
}