import { View } from "../core/View";

export interface IComponent {
    owner: View;
    enable: boolean;
    regist(obj: View): void;
    unRegist(): void;
    dispose(): void;
    toJSON(): any;
    fromJSON(config: any): void;

    /**
     * awake(): void;
     * onEnable(): void;
     * onDisable(): void;
     * onDispose(): void;
     * update(): void;
     */
}