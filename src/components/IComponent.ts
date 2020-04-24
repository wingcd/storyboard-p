import { View } from "../core/View";

export interface IComponent {    
    owner: View;
    enable: boolean;
    regist(obj: View): void;
    unRegist(): void;
    dispose(): void;
    clone(): IComponent;

    /**
     * awake(): void;
     * onEnable(): void;
     * onDisable(): void;
     * onDispose(): void;
     * update(): void;
     */
}