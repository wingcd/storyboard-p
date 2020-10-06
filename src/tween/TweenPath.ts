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
  private _precentData: boolean = false;

  /**
   * 
   * @param target 
   * @param x x The X coordinate of the Path's starting point or a {@link Phaser.Types.Curves.JSONPath}. Default 0.
   * @param y The Y coordinate of the Path's starting point. Default 0.
   * @param precentData 是否使用百分百存储的数据
   */
  constructor(x?:number, y?:number, precentData?: boolean){
    super(x, y);

    this._precentData = !!precentData;
    this.reset();
  }

  rotateBy(type: ETweenPathRotation, target?: Point | View, fixedRotate: number = 0) {
    this._rotationType = type;
    this._fixedRotate = fixedRotate;
    this._rotateTarget = target;
    return this;
  }

  update(tween: Tween) {
    for(let i = 0;i < tween.targets.length;i++) {
      let target = tween.targets[i] as View;
      let t = tween.progress;
      let tweenData = tween.data[i];
      t = Math.min(1, tweenData.current);
      let pos = this.getPoint(t);

      if(this._precentData && target.parent) {
        let parent = target.parent;
        if(parent.width > 0) {
          pos.x *= parent.width;
        }
        if(parent.height > 0) {
          pos.y *= parent.height;
        }
      }

      if(target) {
        let temp = PoolManager.inst.get(Point) as Point;
        temp.setTo(target.x, target.y);
        target.setXY(pos.x, pos.y);

        if(this._rotationType == ETweenPathRotation.Down2Target) {
          temp.setTo(this._rotateTarget.x, this._rotateTarget.y);
          temp.setTo(temp.x - pos.x, temp.y - pos.y); 
          target.angle = 180 - MathUtils.angleBetween(MathUtils.Down, temp) + this._fixedRotate;
        }else if(this._rotationType == ETweenPathRotation.Tangent) {
          if(temp.x != pos.x || temp.y != pos.y) {
            temp.x = pos.x - temp.x;
            temp.y = pos.y - temp.y;
            target.angle = MathUtils.angleBetween(MathUtils.Right, temp) + this._fixedRotate;
          }
        }
        PoolManager.inst.put(temp);
      }
    }
  }

  reset(){
    this._rotationType = ETweenPathRotation.None;
    return this;
  }
}
