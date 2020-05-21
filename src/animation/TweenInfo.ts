import { EEaseType } from "../core/Defines";
import { Tween } from "../phaser";

export interface ITweenPlugin {    
    start?(tween: Tween, t: number): void;
    update(tween: Tween, property: string, t: number, v: number): void;
    repeat?(tween: Tween, property: string, t: number): void;
    stop?(tween: Tween, t: number): void;
    end?(tween: Tween, t: number): void;
    pause?(tween: Tween, t: number): void;
    resume?(tween: Tween, t: number): void;
    complete?(tween: Tween, t: number): void;
}

export interface ITweenInfo {
    type?: EEaseType;
    yoyo?: boolean;
    repeat?: number;
    delay?: number;
    repeatDelay?: number;
    plugin?: ITweenPlugin;
}

export class TweenInfo implements ITweenInfo {
    type?: EEaseType = EEaseType.Known;
    duration: number = 1000;
}