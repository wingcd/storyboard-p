import { MathUtils } from '../utils/Math';
import { View } from '../core/View';
import { Tween } from '../phaser';
import { KeyFrame } from './Timeline';
import { ITweenPlugin } from '../types';

export default class TweenStep implements ITweenPlugin {
  private _target: View;

  constructor(target: View){
    this._target = target;
  }

  update(tween: Tween) {
    let obj:any = this._target;
    if(obj) {
      let t = tween.progress;
      let tweenData = tween.data[0];
      t = Math.min(1, tween.progress);
      let from: KeyFrame = (tween as any).___from__;
      let to: KeyFrame = (tween as any).___to__;
      let reverse: boolean = (tween as any).___reverse__;
      if(reverse) {
        [from, to] = [to, from];
      }
      obj[tweenData.key] = t == 1 ? to.property.value : from.property.value;
    }
  }
}
