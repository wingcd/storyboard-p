import * as Events from "../events";
import { ViewEvent } from "../events/ViewEvent";
import { ViewGroup } from "./ViewGroup";
import { View } from "./View";
import { ERelationPinType } from "../types";

let relationPinTypes = ["LEFT", "RIGHT", "TOP", "BOTTOM", "CENTER", "MIDDLE"];

class RelationPin {
    private _owner: View = null;
    private _relations: Relations = null;
    private _pinType: ERelationPinType;
    private _to: RelationPin = null;
    private _precent: boolean = false;
    
    private _targetX: number = 0;
    private _targetY: number = 0;
    private _intrinsicX: number = 0;    
    private _intrinsicY: number = 0;
    private _targetWidth: number = 0;
    private _targetHeight: number = 0;

    public constructor(owner: View, pinType?: ERelationPinType) {
        this._owner = owner;
        this._pinType = pinType;
    }

    public onOwnerChanged() {
        if(this._to) {
            this._calcIntrinsic();
        }
    }

    private _calcIntrinsic() {        
        this._targetX = this._getX(this._to);
        this._targetY = this._getY(this._to);

        this._targetWidth = this._to._owner._rawWidth;
        this._targetHeight = this._to._owner._rawHeight;

        this._intrinsicX = this._targetX - this._getX(this);
        this._intrinsicY = this._targetY - this._getY(this);
    }

    public get to(): RelationPin {
        return this._to;
    }

    public get pinType(): ERelationPinType {
        return this._pinType;
    }

    public get owner(): View {
        return this._owner;
    }

    public get precent(): boolean {
        return this._precent;
    }

    public set precent(val: boolean) {
        this._precent = val;
    }

    public connect(relations: Relations, target: View, targetPinType: ERelationPinType): this {
        if(this._to) {
            this.disconnect();
        }

        this._relations = relations;
        this._to = new RelationPin(target, targetPinType);

        this._calcIntrinsic();
        this._to.owner.on(Events.DisplayObjectEvent.SIZE_CHANGED, this._onTargetChanged, this);
        this._to.owner.on(Events.DisplayObjectEvent.XY_CHANGED, this._onTargetChanged, this);
        this._to.owner.on(ViewEvent.PARENT_CHANGED, this._onTargetParentChanged, this);
        this.owner.on(ViewEvent.PARENT_CHANGED, this._onParentChanged, this);

        return this;
    }

    public disconnect(): this {
        this._to.owner.off(Events.DisplayObjectEvent.SIZE_CHANGED, this._onTargetChanged, this);
        this._to.owner.off(Events.DisplayObjectEvent.XY_CHANGED, this._onTargetChanged, this);
        this._to.owner.off(ViewEvent.PARENT_CHANGED, this._onTargetParentChanged, this);
        this.owner.off(ViewEvent.PARENT_CHANGED, this._onParentChanged, this);
        this._to = null;

        return this;
    }

    private _getX(pin: RelationPin): number {
        let owner = pin._owner;
        let x = owner.x;
        if(pin._owner == this._owner.parent) {
            x = 0;
        }

        switch(pin._pinType) {
            case ERelationPinType.RIGHT:
                return x + owner._rawWidth;
            case ERelationPinType.CENTER:
                return x + owner._rawWidth * 0.5;
            default:
                return x;
        }
    }

    private _getY(pin: RelationPin): number {
        let owner = pin._owner;
        let y = owner.y;
        if(pin._owner == this._owner.parent) {
            y = 0;
        }
        switch(pin._pinType) {   
            case ERelationPinType.BOTTOM:
                return y + owner._rawHeight;
            case ERelationPinType.MIDDLE:
                return y + owner._rawHeight * 0.5;
            default:
                return y;
        }
    }

    private _onTargetChanged() {        
        let targetX: number = this._getX(this._to);
        let targetY: number = this._getY(this._to);        
        let ownerX: number = this._getX(this);
        let ownerY: number = this._getY(this);

        let offsetX = targetX - ownerX;
        let offsetY = targetY - ownerY;
        
        this._targetX = targetX;
        this._targetY = targetY;

        let newX = this._owner.x;
        let newY = this._owner.y;
        let newWidth: number = this._owner._rawWidth;
        let newHeight: number = this._owner._rawHeight;

        let dx = offsetX - this._intrinsicX;
        let dy = offsetY - this._intrinsicY;
        if(this._precent) {
            if(this._pinType == ERelationPinType.LEFT || this._pinType == ERelationPinType.RIGHT ||
                this._pinType == ERelationPinType.CENTER) {
                    if(this._targetWidth >= 1) {
                        dx = dx / this._targetWidth * this._to._owner._rawWidth;
                    }
            }else if(this._targetHeight >= 1) {
                dy = dy / this._targetHeight * this._to._owner._rawHeight;
            }
        }

        newX = this._owner.x;
        newY = this._owner.y;

        let opPin = this._relations.getOppositePin(this._pinType);
        switch(this._pinType) {
            case ERelationPinType.LEFT:
                if(opPin) {
                    newWidth -= dx;
                    newX += dx;
                }else{
                    newX += dx;
                }
                break;
            case ERelationPinType.RIGHT:
                if(opPin) {
                    newWidth += dx;
                }else{
                    newX += dx;
                }
                break;
            case ERelationPinType.TOP:
                if(opPin) {
                    newHeight -= dy;
                    newY += dy;
                }else{
                    newY += dy;
                }
                break;
            case ERelationPinType.BOTTOM:
                if(opPin) {
                    newHeight += dy;
                }else{
                    newY += dy;
                }
                break;
            case ERelationPinType.CENTER:
                newX += dx;
                break;
            case ERelationPinType.MIDDLE:       
                newY += dy;
                break;
        }
        this._relations._locked = true;
        this.owner.setXY(newX, newY);
        this.owner.setSize(newWidth, newHeight, true);
        this._relations._locked = false;
    }  
    
    private _onParentChanged(sender: View, oldParent: ViewGroup, newParent: ViewGroup) {
        if(oldParent == this._to.owner) {
            this._relations.set(this._pinType, newParent, this._to._pinType);
        }else{
            this._relations.remove(this._pinType);
        }
    }
    
    private _onTargetParentChanged(sender: View, oldParent: ViewGroup, newParent: ViewGroup) {
        if(this._to.owner != this.owner.parent) {
            this._relations.remove(this._pinType);
        }
    }
}

export class Relations {
    private _owner: View;    
    
    /**@internal */
    _locked: boolean = false;

    private _pins:{
        [key: string]: RelationPin;
    } = {};    

    public get pins():{
        [key: string]: RelationPin;
    } {
        return this._pins;
    }

    constructor(owner: View) {
        this._owner = owner;        
        owner.on(Events.DisplayObjectEvent.SIZE_CHANGED, this._ownerChanged, this);
        owner.on(Events.DisplayObjectEvent.XY_CHANGED, this._ownerChanged, this);
    }

    private _ownerChanged() {
        if(!this._locked) {
            for(let key in this._pins) {
                let pin = this._pins[key];
                if(pin) {
                    pin.onOwnerChanged();
                }
            }
        }
    }

    public dispose(): void {
        this._owner.off(Events.DisplayObjectEvent.SIZE_CHANGED, this._ownerChanged, this);
        this._owner.off(Events.DisplayObjectEvent.XY_CHANGED, this._ownerChanged, this);

        for(let key in this._pins) {
            let pin = this._pins[key];
            if(pin) {
                pin.disconnect();
            }
        }
    }

    public getPin(pinType: ERelationPinType): RelationPin {
        return this._pins[pinType];
    }
    
    public set(pinType: ERelationPinType, target: View, targetPinType?: ERelationPinType): RelationPin {
        if(target == this._owner) {
            throw new Error("can not to connect self");
        }

        if(this._owner.parent != target && this._owner.parent != target.parent) {
            throw new Error("just only support connect to parent or same parent object");
        }

        if(this._owner.parent == target && pinType != ERelationPinType.CENTER && pinType != ERelationPinType.MIDDLE) {
           let opType = Relations.getOppositeType(pinType);
           if(targetPinType == opType) {
            throw new Error(`can not connect ${relationPinTypes[pinType]} to ${relationPinTypes[targetPinType]} in nest`);
           }
        }

        targetPinType = targetPinType || pinType;
        if(!Relations.checkCanConnect(pinType, targetPinType)) {
            throw new Error(`can not connect ${relationPinTypes[pinType]} to ${relationPinTypes[targetPinType]}`);
        }

        let pin = this.getPin(pinType);
        if(pin) {
            if(pin.owner == target && (pin.to.pinType == targetPinType)) {
                  return pin;
            }else{
                this._remove(pin);
            }
        }

        pin = new RelationPin(this._owner, pinType);
        this._pins[pinType] = pin;
        pin.connect(this, target, targetPinType);

        return pin;
    }

    private _remove(pin: RelationPin) {
        if(pin) {
            this._pins[pin.pinType] = null;
            pin.disconnect();
        }
    }

    public clear(): this {
        this.remove(ERelationPinType.LEFT);
        this.remove(ERelationPinType.RIGHT);
        this.remove(ERelationPinType.TOP);
        this.remove(ERelationPinType.BOTTOM);
        this.remove(ERelationPinType.MIDDLE);
        this.remove(ERelationPinType.CENTER);

        return this;
    }

    public remove(pinType: ERelationPinType): this {
        let pin = this.getPin(pinType);
        this._remove(pin);
        return this;
    }

    public static checkCanConnect(sourcePinType: ERelationPinType, targetPinType: ERelationPinType): boolean {
        if(sourcePinType == targetPinType) {
            return true;
        }

        let opType = Relations.getOppositeType(sourcePinType);
        return opType == targetPinType;
    }

    public static getOppositeType(pinType: ERelationPinType): ERelationPinType{
        switch(pinType) {
            case ERelationPinType.LEFT:
                return ERelationPinType.RIGHT;
            case ERelationPinType.RIGHT:
                return ERelationPinType.LEFT;
            case ERelationPinType.TOP:
                return ERelationPinType.BOTTOM;
            case ERelationPinType.BOTTOM:
                return ERelationPinType.TOP;
            default:
                return pinType;
        }
    }

    /**@internal */
    getOppositePin(pinType: ERelationPinType): RelationPin{
        if(pinType == ERelationPinType.CENTER || pinType == ERelationPinType.MIDDLE) {
            return null;
        }

        let opType = Relations.getOppositeType(pinType);
        return this.getPin(opType);
    } 
}