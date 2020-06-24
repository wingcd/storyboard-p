import { Property } from "./Property";
import { Tweens, Tween, EventEmitter, Timeline, Scene, Types, Time, Easing } from "../phaser";
import { EEaseType, ParseEaseType } from "../core/Defines";
import * as Events from "../events";
import { View } from "../core/View";
import { PoolManager } from "../utils/PoolManager";
import { ITweenInfo, installTweenPlugin } from "./TweenInfo";
import { MathUtils } from "../utils/Math";
import { GetValue } from "../utils/Object";

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
    private _keyName: string;
    private _propName: string;
    private _target: any;
    private _keyframes: KeyFrame[] = [];
    private _store: any = {};

    constructor(target: any, propName: string) {
        this._target = target;
        this._propName = propName;
        
        this._keyName = this._propName.replace('.', '$');
        if(this._propName.indexOf('.') >= 0) {
            this._target = GetValue(target, propName, undefined, true);
            let names = this._propName.split('.'); 
            this._propName = names[names.length - 1];
        }
    }

    public store() {
        // this._keyframes.forEach(kf=>{
        //     let p = kf.property;
        //     this._store[p.name] = this._target[p.name];
        // });

        this._keyframes.forEach(kf=>{
            let p = kf.property;
            this._store[p._name] = {
                name: p.name,
                target: p.target,
                value: p.target[p.name],
            }
        });
    }

    public resotre() {
        // for(let name in this._store) {
        //     this._target[name] = this._store[name];
        // }

        for(let name in this._store) {
            let p = this._store[name];
            p.target[p.name] = p.value;
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
            kf.property._name = this._keyName;
            kf.property.target = this._target;

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

    private _createTween(index: number, reverse?: boolean, withRaw?:boolean, setStart?: boolean, lastDuration?: number): Types.Tweens.TweenBuilderConfig {
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

            if(kf.tweenInfo.plugin) {
                installTweenPlugin(tween, kf.tweenInfo.plugin);
            }
        }

        let duration = Math.abs(nextKF.time - kf.time);
        let from = reverse ? nextKF : kf;
        let to = reverse ? kf : nextKF;

        tween.duration = duration;
        // if(index == 0 && !reverse ||
        //     index == this._keyframes.length - 1 && reverse) {
        //     tween.offset = from.time;
        // }
        if(reverse && index == this._keyframes.length - 2) {
            tween.offset = lastDuration - from.time;
        }else if(!reverse && index == 0) {
            tween.offset = from.time;
        }
        
        tween.props = {};
        if(setStart ||
            index == 0 && !reverse || 
            reverse && (index + 1) == this._keyframes.length - 1) {
            let data: any = {
                to: to.property.value,
                from: from.property.value,
            };
            tween.props[from.property.name] = data as any;
        }else{
            tween.props[from.property.name] = to.property.value;
        }
        if(withRaw) {
            (tween as any).___from__ = kf;
            (tween as any).___to__ = nextKF;
        }

        return tween;
    }

    public addTweens(timeline: Timeline, reverse?: boolean, lastDuration?: number) {
        let tweens = this.getTweens(reverse, lastDuration);
        for(let i=0;i<tweens.length;i++) {
            let tween = tweens[i];
            timeline.add(tween);
        }
    }

    public getTweens(reverse?: boolean, lastDuration?: number): Types.Tweens.TweenBuilderConfig[] {
        if(this._keyframes.length == 0) {
            return;
        }

        this.sort();

        let tweens: Types.Tweens.TweenBuilderConfig[] = [];
        if(!reverse) {
            for(let idx = 0; idx < this._keyframes.length - 1; idx ++) {
                tweens.push(this._createTween(idx, reverse, true, false, lastDuration));
            }
        }else{
            for(let idx = this._keyframes.length - 2; idx >= 0; idx--) {
                tweens.push(this._createTween(idx, reverse, true, false, lastDuration));
            }
        }
        return tweens;
    }

    public getTween(time: number): Types.Tweens.TweenBuilderConfig {
        if(this._keyframes.length == 0) {
            return;
        }
        this.sort();

        let index = -1;
        for(let idx = 0; idx < this._keyframes.length - 1; idx ++) {
            let kf = this._keyframes[idx];
            let next = this._keyframes[idx + 1];   
            if(kf.time <= time && next.time > time ||
                kf.time <= time && idx == this._keyframes.length - 1) {
                index = idx;
            }
        }

        if(index >= 0 || index < this._keyframes.length) {
            return this._createTween(index, false, true, true);
        }else{
            return null;
        }
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
            this._timeline = null;
        }    
        this._timeline = this._scene.tweens.createTimeline({
            duration: 0,
        });
        this._groups.forEach(group=>{
            this._timeline.init();  
            group.addTweens(this._timeline, reverse, this._timeline.duration);
        });    
        
        this._timeline.on(Tweens.Events.TIMELINE_UPDATE, this._update, this); 
        this._timeline.on(Tweens.Events.TIMELINE_PAUSE, this._pause, this);
        this._timeline.on(Tweens.Events.TIMELINE_RESUME, this._resume, this);
        this._timeline.on(Tweens.Events.TIMELINE_COMPLETE, this._stop, this);
    }

    private _goto(time: number) {
        this._timeline.manager.preUpdate();
        this._timeline.update(window.performance.now()-this._startTime, 0);
        this._timeline.update(window.performance.now()-this._startTime, this._startTime);
        let duration = 0;
        for(let i=0;i<this._timeline.data.length;i++) {
            let tween =  (this._timeline.data[i] as Tween);
            if(i == 0) {
                duration += tween.duration;
                if(tween.isPlaying()) {
                    break;
                }
            }                
            if(i > 0) {
                if(!(this._timeline.data[i-1] as Tween).isPlaying()) {
                    tween.update(window.performance.now(), 0);
                    tween.update(window.performance.now(), time - duration);
                    duration += tween.duration;
                }else{
                    break;
                }
            }
        }
    }

    /**
     * play animation
     * @param startTime start time of animation, range 0 to duration when precent is false, ranage 0 to 1 when precent is true  
     * @param endTime end time of animation, range 0 to duration when precent is false, ranage 0 to 1 when precent is true
     * @param reverse play animation use reverse mode
     * @param precent if use precent time mode, do not use when duration is Infinity
     */
    public play(startTime?: number, endTime?: number, reverse?: boolean, precent?: boolean){
        // if(!this._timeline || this._reverse != reverse) {
        //     this.reset(reverse);
        // }        
        if(this._playing){
            return;
        }
        this.reset(reverse);

        let duration = this.totalDuration;
        if(precent && MathUtils.isNumber(duration)) {
            let startPerc: number = startTime || 0;
            let endPrec: number = endTime || 1;
            startTime = MathUtils.clamp01(startPerc);
            endTime = MathUtils.clamp01(endPrec);
            startTime = startPerc * duration;
            endTime = endPrec * duration;
        }

        this._startTime = startTime;
        this._endTime = endTime;

        this._timeline.play();
        if(this._startTime && MathUtils.isNumber(duration)) {
            this._goto(this._startTime);
        }

        this._playing = true; 
        this._emit(Events.TimelineEvent.START, this);
    }

    /**
     * gotoInDuration 
     * @param time target time in duration,  range 0 to duration when precent is false, range 0 to 1 when precent is true
     * @param precent if use precent mode, do not use when duration is Infinity
     */
    public gotoInDuration(time: number, precent?: boolean) {
        if(this._playing) {
            this.stop();
        }

        if(precent) {
            time = MathUtils.clamp01(time);
            time = this.duration * time;
        }

        this._groups.forEach(g=>{
            let tweenCfg = g.getTween(time);
            if(tweenCfg) {
               let tween = this._scene.tweens.add(tweenCfg);
               let kf = (tweenCfg as any).___from__ as KeyFrame;
               this._scene.tweens.preUpdate();              
               tween.update(window.performance.now(), time - kf.time);
               tween.stop();
            }
        });
    }

    /**
     * gotoInTotalDuration 
     * @param time target time in total duration,  range 0 to duration when precent is false, range 0 to 1 when precent is true
     * @param precent if use precent mode, do not use when duration is Infinity
     */
    public gotoInTotalDuration(time: number, precent?: boolean) {
        if(this._playing) {
            this.stop();
        }

        if(precent) {
            time = MathUtils.clamp01(time);
            time = this.totalDuration * time;
        }

        this.reset(false);
        this._goto(time);
    }

    private _update(timeline: Timeline) {
        if(!this._playing) {
            return;
        }

        this._emit(Events.TimelineEvent.UPDATE, this);

        // limit end time
        if(this._endTime != undefined) {            
            let limit = true;
            if(MathUtils.isNumber(this.totalDuration)) {
                if(this.totalDuration == this._endTime) {
                    limit = false;
                }
            }
            
            if(limit && timeline.totalElapsed - 20 >= this._endTime) {
                this.stop();
                return;
            }
        }
    }

    private _stop() {
        this._playing = false;
        this._emit(Events.TimelineEvent.STOP, this);
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
        this._emit(Events.TimelineEvent.PAUSE, this);
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
        this._emit(Events.TimelineEvent.RESUME, this);
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