import { Property } from "./Property";
import { Tween,EventEmitter, Timeline, Scene, Types, Time } from "../phaser";
import { EEaseType, ParseEaseType } from "../core/Defines";
import * as Events from "../events";
import { View } from "../core/View";
import { PoolManager } from "../utils/PoolManager";
import { ITweenInfo } from "./TweenInfo";
import { MathUtils } from "../utils/Math";

class KeyFrame {
    tag: string = "";
    time: number = 0;
    property: Property = null;
    tween?: ITweenInfo = null;

    static sort(k1: KeyFrame, k2: KeyFrame): number {
        if(k1.time < k2.time) {
            return -1;
        }else if(k1.time > k2.time) {
            return 1;
        }
        return 0;
    }
}

class KeyFrameGroup {
    private _propName: string;
    private _target: any;
    private _keyframes: KeyFrame[] = [];
    private _store: any = {};

    constructor(target: any, propName: string) {
        this._target = target;
        this._propName = propName;
    }

    public store() {
        this._keyframes.forEach(kf=>{
            let p = kf.property;
            this._store[p.name] = this._target[p.name];
        });
    }

    public resotre() {
        for(let name in this._store) {
            this._target[name] = this._store[name];
        }
    }

    public get propName(): string {
        return this._propName;
    }

    public set propName(value: string) {
        this._propName = value;
    }

    public get target(): any {
        return this._target;
    }

    public getAll(): KeyFrame[] {
        return this._keyframes;
    }

    public add(time: number, value: any, tween?: ITweenInfo, tag?: string): KeyFrame {
        let kf = this._keyframes.find((item)=>{
            return item.time == time;
        });

        if(!kf) {
            kf = new KeyFrame();
            kf.property = new Property();
            kf.property.name = this._propName;
            this._keyframes.push(kf);
        }

        kf.tag = tag;
        kf.time = time;
        kf.tween = tween;        
        kf.property.value = value;

        return kf;
    }

    public getAt(time: number): KeyFrame {
        return this._keyframes.find((item)=>{
            return item.time == time;
        });
    }

    public getByTag(tag: string): KeyFrame {
        return this._keyframes.find((item)=>{
            return item.tag == tag;
        });
    }

    public removeAll() {
        this._keyframes.length = 0;
    }

    public removeAt(time: number) {
        let idx = this._keyframes.findIndex(kf=>{
            return kf.time == time;
        })
        if(idx >= 0) {
            this._keyframes.splice(idx, 1);
        }
    }

    public removeByTag(tag: string) {
        let idx = this._keyframes.findIndex(kf=>{
            return kf.tag == tag;
        })
        if(idx >= 0) {
            this._keyframes.splice(idx, 1);
        }
    }

    public remove(kf: KeyFrame) {
        let index = this._keyframes.indexOf(kf);
        if(index >= 0) {
            this._keyframes.splice(index, 1);
        }
    }

    public sort() {
        this._keyframes.sort(KeyFrame.sort);
    }

    private _addTween(timeline: Timeline, index: number): Tween {
        if(index >= this._keyframes.length - 1 || index < 0) {
            return;
        }

        let kf = this._keyframes[index]
        let nextKF = this._keyframes[index + 1];
        let tween:Types.Tweens.TweenBuilderConfig = {targets:this._target};
        if(kf.tween) {
            if(kf.tween.type == null || (kf.tween.type != EEaseType.Known)) {
                tween.ease = ParseEaseType(kf.tween.type);
            }

            tween.yoyo = kf.tween.yoyo || false;
            tween.repeat = kf.tween.repeat ? (kf.tween.repeat < 0 ? Infinity : kf.tween.repeat) : 0; 
            tween.delay = kf.tween.delay || 0;
            tween.repeatDelay = kf.tween.repeatDelay || 0;
            // tween.plugin = kf.tween.plugin;
        }

        let duration = Math.abs(nextKF.time - kf.time);
        let from = kf;
        let to = nextKF;

        tween.duration = duration;
        let data = {
            start: from.property.value,
            to: to.property.value,
        };
        tween.props = {};
        tween.props[from.property.name] = data as any;
    }
}

export class AnimationManager extends EventEmitter {
    private _scene: Scene;
    private _target: any;
    private _groups: KeyFrameGroup[] = [];
    private _time: number = 0;
    private _playing: boolean = false;
    private _timeline: Timeline;
    private _reverse: boolean = false;
    private _startTime: number = -1;
    private _endTime: number = -1;
    private _paused: boolean = false;

    constructor(scene: Scene, target?: any) {
        super();

        this._scene = scene;
        this._timeline = this._scene.tweens.createTimeline();
        this._target = target;
    }

    public getAll(): KeyFrameGroup[] {
        return this._groups;
    }

    /**
     * get keyframe group by property name
     * @param name 
     */
    public get(name: string): KeyFrameGroup {
        return this._groups.find((g => {
           return g.propName == name;
        }));
    }

    /**
     * add property's group
     * @param name property name
     * @param target target object
     */
    public add(name: string, target?: any): KeyFrameGroup {
        if(this.get(name)) {
            return null;
        }
        target = target || this._target;

        let pg = new KeyFrameGroup(target, name);
        this._groups.push(pg);

        return pg;
    }

    /**
     * change keyframe's time
     * @param name property's name
     * @param time pld keyframe's time
     * @param newTime new keyframe's time
     */
    public changeTime(name: string, time: number, newTime: number): boolean {
        let group = this.get(name);
        if(!group) {
            return false;
        }
        
        let kf = group.getAt(time);
        group.removeAt(time);
        group.add(newTime, kf.property.value, kf.tween, kf.tag);
    }

    /**
     * when modify keyframe data, please invoke this to store data
     */
    public store() {
        this._groups.forEach(g=>{
            g.store();
        });
    }

    /**
     * after play done, and when you want to restore perperties value, invoke this
     */
    public restore() {
        this._groups.forEach(g=>{
            g.resotre();
        });
    }

    /**
     * sort keyframes by time
     * after add keyframe, or change keyframe time, need invoke this 
     */
    public sort() {
        this._groups.forEach(g=>{
            g.sort();
        });
    }

    /**
     * get total duration of keyframe groups, maybe get Infinity
     */
    public get totalDuration() {
        return this._timeline.totalDuration;
    }

    public get timeline(): Timeline {
        return this._timeline;
    }

    private _emit(eventType: string, data?: any) {
        if(this._target instanceof View) {
            this._target.emit(eventType, null, data);
        }
        this.emit(eventType, this, data);
    }

    /**
     * play animation
     * @param startTime start time of animation, range 0 to duration when precent is false, ranage 0 to 1 when precent is true  
     * @param endTime end time of animation, range 0 to duration when precent is false, ranage 0 to 1 when precent is true
     * @param reverse play animation use reverse mode
     * @param precent if use precent time mode, do not use when duration is Infinity
     */
    public play(startTime?: number, endTime?: number, reverse?: boolean, precent?: boolean) {
        if(precent) {
            let startPerc: number = startTime || 0;
            let endPrec: number = endTime || 1;
            startTime = MathUtils.clamp01(startPerc);
            endTime = MathUtils.clamp01(endPrec);
            let duration = this.totalDuration;
            startTime = startPerc * duration;
            endTime = endPrec * duration;
        }

        if(this._playing){
            return;
        }
        this._playing = true;
        this._time = startTime || 0;

        this._reverse = reverse;
        this._startTime = startTime || -1;
        this._endTime = endTime || -1;

        this._timeline.play();      

        this._emit(Events.AnimationEvent.START, this);
    }

    /**
     * goto 
     * @param time target time in animation,  range 0 to duration when precent is false, range 0 to 1 when precent is true
     * @param precent if use precent mode, do not use when duration is Infinity
     */
    public goto(time: number, precent?: boolean) {
       
    }

    /**
     * stop this animation
     */
    public stop() {
        if(!this._playing){
            return;
        }
        this._playing = false;

        this._time = 0;
        this._reverse = false;
        this._startTime = -1;
        this._endTime = -1;

        this._timeline.stop();

        this._emit(Events.AnimationEvent.STOP, this);
    }

    /**
     * pause this animation 
     */
    public pause() {
        if(this._paused) {
            return;
        }
        this._paused = true;

        this._timeline.pause();       

        this._emit(Events.AnimationEvent.PAUSE, this);
    }

    /**
     * resume this animation when pausing
     */
    public resume() {
        if(!this._paused) {
            return;
        }
        this._paused = false;

        this._timeline.resume();

        this._emit(Events.AnimationEvent.RESUME, this);
    }
}