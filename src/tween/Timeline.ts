import { Property } from "./Property";
import { Tweens, Tween, EventEmitter, Timeline, Scene, Types, Time, Easing } from "../phaser";
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
    tweenInfo?: ITweenInfo = null;

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

    /**
     * add keyframe
     * @param time key frame time in milliseconds.
     * @param value key frame value in this time
     * @param tweenInfo tween info 
     * @param tag tag for this key frame
     */
    public add(time: number, value: any, tweenInfo?: ITweenInfo, tag?: string): KeyFrameGroup {
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
        kf.tweenInfo = tweenInfo;        
        kf.property.value = value;

        return this;
    }

    public getLast(): KeyFrame {
        if(this._keyframes.length == 0) {
            return null;
        }

        return this._keyframes[this._keyframes.length - 1];
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

    private _createTween(index: number, reverse?: boolean): Types.Tweens.TweenBuilderConfig {
        if(index >= this._keyframes.length - 1 || index < 0) {
            return null;
        }

        let kf = this._keyframes[index]
        let nextKF = this._keyframes[index + 1];

        let tween:Types.Tweens.TweenBuilderConfig = {
            targets:this._target,
            ease: (t: number)=>{
                return t < 1 ? 0 : 1;
            },
        };
        if(kf.tweenInfo) {
            if(kf.tweenInfo.type == null || (kf.tweenInfo.type != EEaseType.Known)) {
                tween.ease = ParseEaseType(kf.tweenInfo.type);
            }

            tween.yoyo = kf.tweenInfo.yoyo || false;
            tween.repeat = kf.tweenInfo.repeat ? (kf.tweenInfo.repeat < 0 ? Infinity : kf.tweenInfo.repeat) : 0; 
            tween.delay = kf.tweenInfo.delay || 0;
            tween.repeatDelay = kf.tweenInfo.repeatDelay || 0;
            // tween.plugin = kf.tween.plugin;
        }

        let duration = Math.abs(nextKF.time - kf.time);
        let from = reverse ? nextKF : kf;
        let to = reverse ? kf : nextKF;

        tween.duration = duration;
        if(index == 0 && !reverse ||
            index == this._keyframes.length - 1 && reverse) {
            tween.offset = from.time;
        }

        let data = {
            from: from.property.value,
            to: to.property.value,
        };
        tween.props = {};
        tween.props[from.property.name] = data as any;

        return tween;
    }

    public addTweens(timeline: Timeline, reverse?: boolean) {
        let tweens = this.getTweens(reverse);
        for(let i=0;i<tweens.length;i++) {
            let tween = tweens[i];
            timeline.add(tween);
        }
    }

    public getTweens(reverse?: boolean): Types.Tweens.TweenBuilderConfig[] {
        if(this._keyframes.length == 0) {
            return;
        }

        this.sort();

        let tweens: Types.Tweens.TweenBuilderConfig[] = [];
        if(!reverse) {
            for(let idx = 0; idx < this._keyframes.length - 1; idx ++) {
                tweens.push(this._createTween(idx, reverse));
            }
        }else{
            for(let idx = this._keyframes.length - 2; idx >= 0; idx--) {
                tweens.push(this._createTween(idx, reverse));
            }
        }
        return tweens;
    }
}

export class TimelineManager extends EventEmitter {
    private _scene: Scene;
    private _target: any;
    private _groups: KeyFrameGroup[] = [];
    private _playing: boolean = false;
    private _timeline: Timeline;
    private _paused: boolean = false;

    private _reverse: boolean = false;
    private _startTime: number = -1;
    private _endTime: number = -1;

    constructor(scene: Scene, target?: any) {
        super();

        this._scene = scene;
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
        group.add(newTime, kf.property.value, kf.tweenInfo, kf.tag);
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
     * Value between 0 and 1. The amount of progress through the Timeline, _excluding loops_.
     */
    public get progress() {
        return this._timeline.progress;
    }

    /**
     * Value between 0 and 1. The amount through the entire Timeline, including looping.
     */
    public get totalProgress() {
        return this._timeline.totalProgress;
    }

    /**
     * Elapsed time in ms/frames of this run through of the Timeline.
     */
    public get elapsed() {
        return this._timeline.elapsed;
    }

    /**
     * Total elapsed time in ms/frames of the entire Timeline, including looping.
     */
    public get totalElapsed() {
        return this._timeline.totalElapsed;
    }

    /**
     * get total duration of keyframe groups, maybe get Infinity
     */
    public get duration() {
        return this._timeline.duration;
    }

    /**
     * get total duration of keyframe groups include loops, maybe get Infinity
     */
    public get totalDuration() {
        return this._timeline.totalDuration;
    }

    private _emit(eventType: string, data?: any) {
        if(this._target instanceof View) {
            this._target.emit(eventType, null, data);
        }
        this.emit(eventType, this, data);
    }

    /**
     * after changed keyframe data, please invoke this
     */
    public reset(reverse?:boolean) {  
        this._reverse = reverse;
        if(this._timeline) {
            this._timeline.stop();
            this._timeline.shutdown();
            this._timeline = null;
        }    
        this._timeline = this._scene.tweens.createTimeline({
            duration: 0,
        });
        this._groups.forEach(group=>{
            group.addTweens(this._timeline, reverse);
        });      
        this._timeline.on(Tweens.Events.TIMELINE_UPDATE, this._update, this); 
    }

    /**
     * play animation
     * @param startTime start time of animation, range 0 to duration when precent is false, ranage 0 to 1 when precent is true  
     * @param endTime end time of animation, range 0 to duration when precent is false, ranage 0 to 1 when precent is true
     * @param reverse play animation use reverse mode
     * @param precent if use precent time mode, do not use when duration is Infinity
     */
    public play(startTime?: number, endTime?: number, reverse?: boolean, precent?: boolean){
        if(!this._timeline || this._reverse != reverse) {
            this.reset(reverse);
        }

        if(precent) {
            let startPerc: number = startTime || 0;
            let endPrec: number = endTime || 1;
            startTime = MathUtils.clamp01(startPerc);
            endTime = MathUtils.clamp01(endPrec);
            let duration = this.totalDuration;
            startTime = startPerc * duration;
            endTime = endPrec * duration;
        }

        this._startTime = startTime;
        this._endTime = endTime;

        if(this._playing){
            return;
        }
        this._playing = true;   

        if(this._startTime) {
            this._timeline.totalElapsed = this._startTime;
        }
        this._timeline.play();

        this._emit(Events.AnimationEvent.START, this);
    }

    private _update(timeline: Timeline) {
        this._emit(Events.AnimationEvent.UPDATE, this);

        if(this._endTime && timeline.totalElapsed >= this._endTime) {
            this.stop();
            return;
        }
    }

    private _stop() {
        this._playing = false;
        this._emit(Events.AnimationEvent.STOP, this);
    }

    /**
     * stop this animation
     */
    public stop() {
        if(!this._playing){
            return;
        }
        this._timeline.stop();

        this._stop();
    }

    private _pause() {
        this._paused = true;   
        this._emit(Events.AnimationEvent.PAUSE, this);
    }

    /**
     * pause this animation 
     */
    public pause() {
        if(this._paused) {
            return;
        }

        this._timeline.pause();       

        this._pause();
    }

    private _resume() {
        this._paused = false;
        this._emit(Events.AnimationEvent.RESUME, this);
    }

    /**
     * resume this animation when pausing
     */
    public resume() {
        if(!this._paused) {
            return;
        }

        this._timeline.resume();
        this._resume();
    }
}