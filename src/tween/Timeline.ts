import { Tweens, Tween, EventEmitter, Timeline, Scene, Types, Time, Easing } from "../phaser";
import { EEaseType, ParseEaseType, ECategoryType } from "../core/Defines";
import * as Events from "../events";
import { View } from "../core/View";
import { PoolManager } from "../utils/PoolManager";
import { installTweenPlugin } from "./TweenInfo";
import { MathUtils } from "../utils/Math";
import { GetValue, GetViewRelativePath, GetViewByRelativePath, IsViewChild } from "../utils/Object";
import TweenStep from "./TweenStep";
import { ITweenInfo } from "../types";
import { ISerializeFields } from "../types";
import { Package } from "../core/Package";
import { ITemplatable } from "../types/ITemplatable";
import { Templates } from "../core/Templates";
import { Deserialize, Serialize } from "../utils/Serialize";

export class KFProperty {
    _name: string = null;
    name: string = null;
    value: any = null;
    target: any = null;

    static SERIALIZABLE_FIELDS: ISerializeFields = {
        name: {},
        value: {},
    };
}

export class KeyFrame {
    static SERIALIZABLE_FIELDS: ISerializeFields = {
        tag: {default: ""},
        time: {default: 0},            
        property: {alias: "prop", type: KFProperty},
        // to do... 
        // 需要序列化
        tweenInfo: {alias: "tween", raw: true},
    };
    
    tag: string = "";
    time: number = 0;
    property: KFProperty = null;
    tweenInfo?: ITweenInfo = null;

    static sort(k1: KeyFrame, k2: KeyFrame): number {
        return k1.time - k2.time;
    }
}

export class KeyFrameGroup {
    static SERIALIZABLE_FIELDS: ISerializeFields = {
        propPath: {property: "_propPath"},
        targetPath: {property: "_targetPath", alias: "path", default: ""},
        keyframes: {property: "_keyframes", alias: "frames", type: KeyFrame},
    }

    static DESERIALIZE(config: any, target: TimelineManager, configProp: string, targetProp: string, tpl: any, index?: number) {
        return new KeyFrameGroup(target, config.prop);
    }

    private _parent: TimelineManager;
    private _keyName: string;
    private _propName: string;    
    private _propPath: string;
    private _targetPath: string = "";
    private _target: View;
    private _realTarget: any;
    private _store: any = {};

    private _keyframes: KeyFrame[] = [];

    constructor(parent: TimelineManager, propPath: string) {
        this._parent = parent;
        this._propPath = this._propName = propPath;
        
        this.init();
    }

    /**@internal */
    init(): this {
        this._propName = this._propPath || "";
        this._keyName = this._propName.replace('.', '$');
        if(this._propName.indexOf('.') >= 0) {
            let names = this._propName.split('.');
            this._propName = names[names.length - 1];
        }
        return this;
    }

    /**@internal */
    bindTarget(target: View): this {         
        this._realTarget = this._target = target;
        this._targetPath = GetViewRelativePath(this._parent.target, this._target);

        if(this._target) {
            if(this._propPath) {
                this._realTarget = GetValue(target, this._propPath, target, true);
            }

            let kfs = this._keyframes.slice();
            this._keyframes.length = 0;

            for(let k of kfs) {
                this.add(k.time, k.property.value, k.tweenInfo, k.tag);
            }
        }

        return this;
    }

    /**@internal */
    onParentTargetChanged(): this {
        let root = this._parent.target;
        if(this._targetPath) {
            this._target = GetViewByRelativePath(root, this._targetPath) as View;
        }else{
            this._target = IsViewChild(root, this._target) ? this._target : this._parent.target;            
            this._targetPath = GetViewRelativePath(root, this._target);
        }

        this._realTarget = this._target;
        if(this._target) {
            let kfs = this._keyframes.slice();
            this._keyframes.length = 0;

            if(this._propPath) {
                this._realTarget = GetValue(this.target, this._propPath, this.target, true);
            }

            for(let k of kfs) {
                this.add(k.time, k.property.value, k.tweenInfo, k.tag);
            }
        }

        return this;
    }

    public store(): this {
        if(this.target) {
            this._keyframes.forEach(kf=>{
                let p = kf.property;
                this._store[p._name] = {
                    name: p.name,
                    target: p.target,
                    value: p.target[p.name],
                }
            });
        }
        return this;
    }

    public resotre(): this {
        for(let name in this._store) {
            let p = this._store[name];
            p.target[p.name] = p.value;
        }

        return this;
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

    public get frames(): KeyFrame[] {
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
            kf.property = new KFProperty();
            kf.property.name = this._propName;
            kf.property._name = this._keyName;
            kf.property.target = this._realTarget;

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

    public removeAll(): this {
        this._keyframes.length = 0;
        return this;
    }

    public removeAt(time: number): boolean {
        let idx = this._keyframes.findIndex(kf=>{
            return kf.time == time;
        })
        if(idx >= 0) {
            this._keyframes.splice(idx, 1)[0];
        }
        return idx >= 0;
    }

    public removeByTag(tag: string): boolean {
        let idx = this._keyframes.findIndex(kf=>{
            return kf.tag == tag;
        })
        if(idx >= 0) {
            this._keyframes.splice(idx, 1);
        }
        return idx >= 0;
    }

    public remove(kf: KeyFrame): boolean {
        let index = this._keyframes.indexOf(kf);
        if(index >= 0) {
            this._keyframes.splice(index, 1);
        }
        return index >= 0;
    }

    public sort(): this {
        this._keyframes.sort(KeyFrame.sort);
        return this;
    }

    private _createTween(index: number, reverse?: boolean, setStart?: boolean, totalDuration?: number, currentDuration?: number): Types.Tweens.TweenBuilderConfig {
        if(index >= this._keyframes.length - 1 || index < 0) {
            return null;
        }

        let kf = this._keyframes[index]
        let nextKF = this._keyframes[index + 1];

        let tweenData:Types.Tweens.TweenBuilderConfig = {
            targets: this._realTarget,
            ease: (t: number)=>{
                return t < 1 ? 0 : 1;
            },
        };
        if(kf.tweenInfo) {
            if(kf.tweenInfo.type == null || (kf.tweenInfo.type != EEaseType.Known)) {
                tweenData.ease = ParseEaseType(kf.tweenInfo.type);
            }

            tweenData.yoyo = kf.tweenInfo.yoyo || false;
            tweenData.repeat = kf.tweenInfo.repeat ? (kf.tweenInfo.repeat < 0 ? Infinity : kf.tweenInfo.repeat) : 0; 
            tweenData.delay = kf.tweenInfo.delay || 0;
            tweenData.repeatDelay = kf.tweenInfo.repeatDelay || 0;

            if(kf.tweenInfo.plugin) {
                installTweenPlugin(tweenData, kf.tweenInfo.plugin);
            }else if(typeof(kf.property.value) !== 'number') {
                installTweenPlugin(tweenData, new TweenStep(this._target));
            }
        }else{
            if(typeof(kf.property.value) !== 'number') {
                installTweenPlugin(tweenData, new TweenStep(this._target));
            }
        }

        let duration = Math.abs(nextKF.time - kf.time);
        let from = reverse ? nextKF : kf;
        let to = reverse ? kf : nextKF;

        tweenData.duration = duration;
        
        // add props
        tweenData.props = {};
        if(setStart ||
            index == 0 && !reverse || 
            reverse && (index + 1) == this._keyframes.length - 1) {
            let data: any = {
                to: to.property.value,
                from: from.property.value,
            };
            tweenData.props[from.property.name] = data as any;
        }else{
            tweenData.props[from.property.name] = to.property.value;
        }
        
        (tweenData as any).___from__ = kf;
        (tweenData as any).___to__ = nextKF;
        (tweenData as any).___reverse__ = reverse;

        if(reverse && index == this._keyframes.length - 2) {
            tweenData.offset = totalDuration - currentDuration || 0;
        }else if(!reverse && index == 0) {
            tweenData.offset = from.time;
        }

        return tweenData;
    }

    public addTweens(timeline: Timeline, reverse?: boolean, totalDuration?: number, currentDuration?: number): this {
        let tweens = this.getTweens(reverse, totalDuration, currentDuration);
        KeyFrameGroup.addTweensEx(timeline, tweens);       
                
        // set value to last frame
        let frames = this.frames;
        if(frames.length > 0) {
            let prop = frames[frames.length - 1].property;
            prop.target[prop.name] = prop.value;
        }
        
        return this;
    }

    public static addTweensEx(timeline: Timeline, tweens: Types.Tweens.TweenBuilderConfig[]) {
        for(let i=0;i<tweens.length;i++) {
            let tweenData:any = tweens[i];
            timeline.add(tweenData);
            let tween = timeline.data[timeline.data.length - 1];
            KeyFrameGroup.initTween(tween, tweenData);
        }
    }

    public static initTween(tween: Tween, tweenData: Types.Tweens.TweenBuilderConfig) {
        (tween as any).___from__ = (tweenData  as any).___from__;
        (tween as any).___to__ = (tweenData as any).___to__;
        (tween as any).___reverse__ = (tweenData as any).___reverse__;
    }

    public getTweens(reverse?: boolean, totalDuration?: number, currentDuration?: number): Types.Tweens.TweenBuilderConfig[] {
        if(this._keyframes.length == 0) {
            return;
        }

        this.sort();

        let tweens: Types.Tweens.TweenBuilderConfig[] = [];
        if(!reverse) {
            for(let idx = 0; idx < this._keyframes.length - 1; idx ++) {
                tweens.push(this._createTween(idx, reverse, false, totalDuration, currentDuration));
            }
        }else{
            for(let idx = this._keyframes.length - 2; idx >= 0; idx--) {
                tweens.push(this._createTween(idx, reverse, false, totalDuration, currentDuration));
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
        if(index < 0) {
            if(time < this._keyframes[0].time) {
                index = 0;
            }else if(this._keyframes.length > 1){
                index = this._keyframes.length - 2;
            }
        }

        if(index < 0) {
            return null;
        }
        
        return this._createTween(index, false, true);
    }

    public setParent(parent: TimelineManager): this {
        this._parent = parent;
        this.onParentTargetChanged();
        return this;
    }

    public destory() {
        this._keyframes.length = 0;
    }
}

export class TimelineManager extends EventEmitter implements ITemplatable {
    static CATEGORY = ECategoryType.Timeline;
    
    static SERIALIZABLE_FIELDS: ISerializeFields = {
        CATEGORY: {alias: "__category__", static: true, readOnly: true},

        resourceUrl: {},
        id: {importAs: "_id"},
        name: {importAs: "_name"},
        playOnEnable: {default: false},
        groups: {importAs: "_groups", type: KeyFrameGroup, default: []},
    }
    
    private _id: string;
    private _name: string;
    private _groups: KeyFrameGroup[] = [];
    
    public playOnEnable: boolean = false;
    
    private _scene: Scene;
    private _target: View;
    private _playing: boolean = false;
    private _timeline: Timeline;
    private _paused: boolean = false;

    private _reverse: boolean = false;
    private _startTime: number = -1;
    private _endTime: number = -1;

    public resourceUrl: string;

    constructor(name?: string, scene?: Scene, target?: View) {
        super();

        this._id = `${Package.getUniqueID()}`;
        this._name = name;
        this._scene = scene;
        this._target = target;
    }

    public get target(): View {
        return this._target;
    }

    public get scene(): Scene {
        return this._scene;
    }

    public get id(): string {
        return this._id;
    }

    public set name(val: string) {
        this._name = val;
    }

    public get name(): string {
        return this._name;
    }

    public get groups(): KeyFrameGroup[] {
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
     * @param name property name, must start with [A-z, 0-9]
     * @param target target object
     * @returns new group when name is not exist, or old group by name
     */
    public add(name: string, target?: any): KeyFrameGroup {
        if(this.get(name)) {
            return null;
        }
        
        target = target || this._target;
        let pg = new KeyFrameGroup(this, name);
        pg.bindTarget(target);
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
    public store(): this {
        this._groups.forEach(g=>{
            g.store();
        });
        return this;
    }

    /**
     * after play done, and when you want to restore perperties value, invoke this
     */
    public restore(): this {
        this._groups.forEach(g=>{
            g.resotre();
        });
        return this;
    }

    /**
     * sort keyframes by time
     * after add keyframe, or change keyframe time, need invoke this 
     */
    public sort(): this {
        this._groups.forEach(g=>{
            g.sort();
        });
        return this;
    }

    /**
     * Value between 0 and 1. The amount of progress through the Timeline, _excluding loops_.
     */
    public get progress(): number {
        return this._timeline.progress;
    }

    /**
     * Value between 0 and 1. The amount through the entire Timeline, including looping.
     */
    public get totalProgress(): number {
        return this._timeline.totalProgress;
    }

    /**
     * Elapsed time in ms/frames of this run through of the Timeline.
     */
    public get elapsed(): number {
        return this._timeline.elapsed;
    }

    /**
     * Total elapsed time in ms/frames of the entire Timeline, including looping.
     */
    public get totalElapsed(): number {
        return this._timeline.totalElapsed;
    }

    /**
     * get total duration of keyframe groups, maybe get Infinity
     */
    public get duration(): number {
        return this._timeline.duration;
    }

    /**
     * get total duration of keyframe groups include loops, maybe get Infinity
     */
    public get totalDuration(): number {
        return this._timeline.totalDuration;
    }

    private _emit(eventType: string, ...data: any[]) {
        if(this._target instanceof View) {
            this._target.emit(eventType, ...data);
        }
        this.emit(eventType, this, ...data);
    }   

    private _getDuration( tweenDatas: any[]) {
        let duration = 0;
        let tweens: Tween[] = [];
        for(let tweenData of tweenDatas) {
            let tween = this._scene.add.tween(tweenData);
            KeyFrameGroup.initTween(tween, tweenData);
            tween.init();
            tweens.push(tween);
        }

        duration = tweens.reduce((total:number, current:Tween)=>{
            return total + current.duration;
        }, 0);

        for(let tween of tweens) {
            tween.stop();
        }

        return duration;
    }

    /**
     * after changed keyframe data, please invoke this
     */
    public reset(reverse?:boolean): this {  
        this._reverse = reverse;
        if(this._timeline) {
            this._timeline.removeAllListeners();
            this._timeline.stop();
            this._timeline = null;
        }    
        this._timeline = this._scene.tweens.createTimeline({
            duration: 0,
        });

        let gtweens:{group:KeyFrameGroup, tweenDatas:Types.Tweens.TweenBuilderConfig[]}[] = [];
        this._groups.forEach(group=>{
            let tweenDatas = group.getTweens(reverse);
            gtweens.push({group, tweenDatas});

            KeyFrameGroup.addTweensEx(this._timeline, tweenDatas);
        });
        this._timeline.init();  
        
        if(reverse) {
            let duration = this._timeline.duration;
            this._timeline.stop();
            this._timeline = this._scene.tweens.createTimeline({
                duration: 0,
            });   
            gtweens.forEach(item=>{
                item.group.addTweens(this._timeline, reverse, duration, this._getDuration(item.tweenDatas));
            });            
            this._timeline.init();  
        }
        
        this._timeline.on(Tweens.Events.TIMELINE_UPDATE, this._update, this); 
        this._timeline.on(Tweens.Events.TIMELINE_PAUSE, this._pause, this);
        this._timeline.on(Tweens.Events.TIMELINE_RESUME, this._resume, this);
        this._timeline.on(Tweens.Events.TIMELINE_COMPLETE, this._stop, this);

        return this;
    }

    private _goto(time: number) {
        this._timeline.manager.preUpdate();
        this._timeline.update(window.performance.now()-time, 0);
        this._timeline.update(window.performance.now()-time, time);

        for(let i=0;i<this._timeline.data.length;i++) {
            let tween =  (this._timeline.data[i] as Tween);
            let target:any = tween.targets[0];
            //update tween state
            tween.update(window.performance.now(), 0);
            if(target.___tween_duration___ === undefined) {
                target.___tween_duration___ = tween.duration;
                if(target.___tween_out___ || tween.isPlaying()) {
                    target.___tween_out___ = true;
                    continue;
                }
            }

            if(i > 0) {
                let preTween = (this._timeline.data[i-1] as Tween);
                let preTarget:any = preTween.targets[0];

                if(!preTarget.___tween_out___ && !preTween.isPlaying()) {
                    tween.update(window.performance.now(), time - preTarget.___tween_duration___);
                    preTarget.___tween_duration___ += preTween.duration;
                }else{
                    continue;
                }
            }
        }

        for(let i=0;i<this._timeline.data.length;i++) {
            let target:any =  (this._timeline.data[i] as Tween).targets[0];
            delete target.___tween_duration___;
            delete target.___tween_out___;
        }

        this._timeline.update(window.performance.now(), 0);
    }

    /**
     * play animation
     * @param startTime start time of animation, range 0 to duration when precent is false, ranage 0 to 1 when precent is true  
     * @param endTime end time of animation, range 0 to duration when precent is false, ranage 0 to 1 when precent is true
     * @param reverse play animation use reverse mode
     * @param precent if use precent time mode, do not use when duration is Infinity
     */
    public play(startTime?: number, endTime?: number, reverse?: boolean, precent?: boolean): this{
        // if(!this._timeline || this._reverse != reverse) {
        //     this.reset(reverse);
        // }        
        if(this._playing || !this._scene || !this._target){
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

        return this;
    }

    /**
     * gotoInDuration 
     * @param time target time in duration,  range 0 to duration when precent is false, range 0 to 1 when precent is true
     * @param precent if use precent mode, do not use when duration is Infinity
     */
    public gotoInDuration(time: number, precent?: boolean): this {
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
               KeyFrameGroup.initTween(tween, tweenCfg);
               let kf = (tweenCfg as any).___from__ as KeyFrame;
               this._scene.tweens.preUpdate();              
               tween.update(window.performance.now(), 0);
               tween.seek(0, time - kf.time);
               tween.stop();
            }
        });

        return this;
    }

    /**
     * gotoInTotalDuration 
     * @param time target time in total duration,  range 0 to duration when precent is false, range 0 to 1 when precent is true
     * @param precent if use precent mode, do not use when duration is Infinity
     */
    public gotoInTotalDuration(time: number, precent?: boolean): this {
        if(this._playing) {
            this.stop();
        }

        if(precent) {
            time = MathUtils.clamp01(time);
            time = this.totalDuration * time;
        }

        this.reset(false);
        this._timeline.play();
        this._goto(time);
        this._timeline.stop();

        return this;
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
    public stop(): this {
        if(!this._playing){
            return;
        }
        this._timeline.stop();

        this._stop();

        return this;
    }

    private _pause() {
        this._paused = true;   
        this._emit(Events.TimelineEvent.PAUSE, this);
    }

    /**
     * pause this animation 
     */
    public pause(): this {
        if(this._paused) {
            return;
        }

        this._timeline.pause();       

        this._pause();

        return this;
    }

    private _resume() {
        this._paused = false;
        this._emit(Events.TimelineEvent.RESUME, this);
    }

    /**
     * resume this animation when pausing
     */
    public resume(): this {
        if(!this._paused) {
            return;
        }

        this._timeline.resume();
        this._resume();

        return this;
    }

    public bindTarget(scene: Scene, target: View): this {
        this._scene = scene;
        this._target = target;
        this._groups.forEach(g=>{
            g.setParent(this);
        });

        return this;
    }

    public destroy() {
        if(this._timeline) {
            this._timeline.removeAllListeners();
            this._timeline.stop();
            this._timeline = null;
        }

        this._groups.forEach(g=>{
            g.destory();
        });
        this._groups.length = 0;
    }

    public toJSON(tpl?: any, ignores?: string[]): any {
        let temp = null;
        if(this.resourceUrl) {
            temp = Package.inst.getTemplateFromUrl(this.resourceUrl);
        }
        return Serialize(this, temp || tpl, ignores);
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            Deserialize(this, config, template);
        }        

        return this;
    }

    public clone(): TimelineManager {
        let json = this.toJSON();
        return new TimelineManager().fromJSON(json);
    }
}

Templates.regist(TimelineManager.CATEGORY, TimelineManager);