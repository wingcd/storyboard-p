import { EEaseType } from "../core/Defines";
import { Types } from "../phaser";
import { ITweenInfo, ITweenPlugin } from "../types";

export class TweenInfo implements ITweenInfo {
    type?: EEaseType = EEaseType.Known;
    duration?: number = 1000;
}

export function installTweenPlugin(tween: Types.Tweens.TweenBuilderConfig, plugin: ITweenPlugin) {
    if(plugin.start) {
        tween.onStart = (tw, targets, param) =>{
            plugin.start(tw);
        };
    }

    if(plugin.update) {
        tween.onUpdate = (tw, targets, param) =>{
            plugin.update(tw);
        };
    }

    if(plugin.repeat) {
        tween.onRepeat = (tw, targets, param) =>{
            plugin.repeat(tw);
        };
    }

    if(plugin.yoyo) {
        tween.onYoyo = (tw, targets, param) =>{
            plugin.yoyo(tw);
        };
    }

    if(plugin.complete) {
        tween.onComplete = (tw, targets, param) =>{
            plugin.complete(tw);
        };
    }
}