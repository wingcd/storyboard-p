import { Tween, Timeline, Types } from "../phaser";
import { EEaseType } from "../core/Defines";
import { Property } from "../tween/Property";

export interface IKeyFrame {
    tag: string;
    time: number;
    property: Property;
    tweenInfo?: ITweenInfo;
}

export interface ITweenPlugin {    
    start?(tween: Tween): void;
    update?(tween: Tween): void;
    repeat?(tween: Tween): void;
    yoyo?(tween: Tween): void;
    complete?(tween: Tween): void;
}

export interface ITweenInfo {
    type?: EEaseType;
    duration?: number;
    yoyo?: boolean;
    repeat?: number;
    delay?: number;
    repeatDelay?: number;
    plugin?: ITweenPlugin;
}

export interface IKeyFrameGroup {
    propName: string;
    target: any;

    store(): this;
    resotre(): this;
    getAll(): IKeyFrame[];
    add(time: number, value: any, tweenInfo?: ITweenInfo, tag?: string): IKeyFrameGroup;
    getLast(): IKeyFrame;
    getAt(time: number): IKeyFrame;
    getByTag(tag: string): IKeyFrame;
    removeAt(time: number): boolean;
    removeByTag(tag: string): boolean;
    remove(kf: IKeyFrame): boolean;
    sort(): this;
    addTweens(timeline: Timeline, reverse?: boolean, totalDuration?: number, currentDuration?: number): this;
    getTweens(reverse?: boolean, totalDuration?: number, currentDuration?: number): Types.Tweens.TweenBuilderConfig[];
    getTween(time: number): Types.Tweens.TweenBuilderConfig;
}

export interface ITimelineManagerConfig {

}

export interface ITimelineManager extends ITimelineManagerConfig {
    progress: number;
    totalProgress: number;
    elapsed: number;
    totalElapsed: number;
    duration: number;
    totalDuration: number;

    getAll(): IKeyFrameGroup[];
    get(name: string): IKeyFrameGroup;
    add(name: string, target?: any): IKeyFrameGroup;
    changeTime(name: string, time: number, newTime: number): boolean;
    store(): this;
    restore(): this;
    sort(): this;
    reset(reverse?:boolean): this;
    play(startTime?: number, endTime?: number, reverse?: boolean, precent?: boolean): this;
    gotoInDuration(time: number, precent?: boolean): this;
    gotoInTotalDuration(time: number, precent?: boolean): this;
    stop(): this;
    pause(): this;
    resume(): this;    
}