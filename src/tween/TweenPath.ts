import { MathUtils } from '../utils/Math';
import { View } from '../core/View';
import { PoolManager } from '../utils/PoolManager';
import { Point, Tween } from '../phaser';
import { ITweenPlugin } from '../types';

export const enum ETweenPathRotation {
  None,
  Down2Target,
  Tangent,
}

export default class TweenPath extends Phaser.Curves.Path implements ITweenPlugin {
  private _rotationType = ETweenPathRotation.None;
  private _rotateTarget: View | Point = null;
  private _fixedRotate: number = 0;
  private _target: View;

  constructor(target: View, x?:number, y?:number){
    super(x, y);

    this._target = target;
    this.reset();
  }

  rotateBy(type: ETweenPathRotation, target?: Point | View, fixedRotate: number = 0) {
    this._rotationType = type;
    this._fixedRotate = fixedRotate;
    this._rotateTarget = target;
    return this;
  }

   update(tween: Tween) {
    let obj = this._target;
    let t = tween.progress;
    let tweenData = tween.data[0];
    t = Math.min(1, tweenData.current);
    let pos = this.getPoint(t);
    if(obj) {
      let temp = PoolManager.inst.get(Point) as Point;
      temp.setTo(obj.x, obj.y);
      obj.setXY(pos.x, pos.y);

      if(this._rotationType == ETweenPathRotation.Down2Target) {
        temp.setTo(this._rotateTarget.x, this._rotateTarget.y);
        temp.setTo(temp.x - pos.x, temp.y - pos.y); 
        obj.angle = 180 - MathUtils.angleBetween(MathUtils.Down, temp) + this._fixedRotate;
      }else if(this._rotationType == ETweenPathRotation.Tangent) {
        if(temp.x != pos.x || temp.y != pos.y) {
          temp.x = pos.x - temp.x;
          temp.y = pos.y - temp.y;
          obj.angle = MathUtils.angleBetween(MathUtils.Right, temp) + this._fixedRotate;
        }
      }
      PoolManager.inst.put(temp);
    }
  }

  reset(){
    this._rotationType = ETweenPathRotation.None;
    return this;
  }
}
