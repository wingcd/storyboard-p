import * as Events from "../events";
import { ViewGroup } from "./ViewGroup";
import { View } from "./View";
import { GetViewByRelativePath, GetViewRelativePath, IsViewChild } from "../utils/Object";
import { ISerializeInfo } from "../types";
import { ERelationPinType } from "./Defines";

let relationPinTypes = ["LEFT", "RIGHT", "TOP", "BOTTOM", "CENTER", "MIDDLE"];

class RelationPin {
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields: ISerializeInfo[] = [];
        fields.push(
            {property: "_ownerName", alias: "owner", default: ''},
            {property: "_precent", alias: "precent", default: false},            
            {property: "_pinType", alias: "pinType", default: ERelationPinType.LEFT},                             
            {property: "_to", alias: "to", type: RelationPin, default: null},
        );
        return fields;
    }
    
    private _ownerName: string = '';
    private _owner: View = null;
    private _relations: Relations = null;
    private _pinType: ERelationPinType;
    private _precent: boolean = false;
    private _to: RelationPin = null;
    
    private _targetX: number = 0;
    private _targetY: number = 0;
    private _intrinsicX: number = 0;    
    private _intrinsicY: number = 0;
    private _targetWidth: number = 0;
    private _targetHeight: number = 0;

    private _locked = false;

    public constructor(pinType?: ERelationPinType) {
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
        targetPinType = targetPinType || ERelationPinType.LEFT;

        this._relations = relations;
        this._to = new RelationPin(targetPinType).setParent(relations).setOwner(target);

        this._calcIntrinsic();
        this._to.owner.on(Events.DisplayObjectEvent.SIZE_CHANGED, this._onTargetChanged, this);
        this._to.owner.on(Events.DisplayObjectEvent.XY_CHANGED, this._onTargetChanged, this);
        this._to.owner.on(Events.DisplayObjectEvent.PARENT_CHANGED, this._onTargetParentChanged, this);
        this.owner.on(Events.DisplayObjectEvent.PARENT_CHANGED, this._onParentChanged, this);

        return this;
    }

    private _offEvents() {
        if(this._to && this._to.owner) {
            this._to.owner.off(Events.DisplayObjectEvent.SIZE_CHANGED, this._onTargetChanged, this);
            this._to.owner.off(Events.DisplayObjectEvent.XY_CHANGED, this._onTargetChanged, this);
            this._to.owner.off(Events.DisplayObjectEvent.PARENT_CHANGED, this._onTargetParentChanged, this);
        }
        
        if(this.owner) {
            this.owner.off(Events.DisplayObjectEvent.PARENT_CHANGED, this._onParentChanged, this);
        }
    }

    public disconnect(): this {
        this._offEvents();
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
        if(this._locked) {
            return;
        }
        this._locked = true;
        
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

        this._locked = false;
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

    /**@internal */
    setOwner(owner: View): this {
        if(owner != this.owner) {
            this._offEvents();
                
            this._owner = owner;
            let parent = this._relations.owner.parent;
            this._ownerName = GetViewRelativePath(parent, this._owner);
            if(this._owner && this._to) {
                let target = GetViewByRelativePath(parent, this._to._ownerName) as View;
                this.connect(this._relations, target, this._to.pinType);
            }
        }

        return this;
    }

    /**@internal */
    onParentTargetChanged(): this {        
        let parent = this._relations.owner.parent;    
        this._offEvents();

        if(this._ownerName) {
            this._owner = GetViewByRelativePath(parent, this._ownerName) as View;
        }else{
            this._owner = IsViewChild(parent, this._owner) ? this._owner : this._relations.owner;            
            this._ownerName = GetViewRelativePath(parent, this._owner);
        }

        if(this._owner && this._to) {
            let target = GetViewByRelativePath(parent, this._to._ownerName) as View;
            this.connect(this._relations, target, this._to.pinType);
        }

        return this;
    }

    /**@internal */
    setParent(parent: Relations): this {
        this._relations = parent;
        this.onParentTargetChanged();
        return this;
    }
}

export class Relations {
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields: ISerializeInfo[] = [];
        fields.push(                               
            {property: "_pins", alias: "pins", type: RelationPin, default: {}, asMap: true},
        );
        return fields;
    }

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

    constructor() {
        
    }

    focusUpdateOwner(owner: View) {
        if(this._owner) {
            this._owner.off(Events.DisplayObjectEvent.SIZE_CHANGED, this._ownerStateChanged, this);
            this._owner.off(Events.DisplayObjectEvent.XY_CHANGED, this._ownerStateChanged, this);
        }

        this._owner = owner;    
        if(owner) {    
            owner.on(Events.DisplayObjectEvent.SIZE_CHANGED, this._ownerStateChanged, this);
            owner.on(Events.DisplayObjectEvent.XY_CHANGED, this._ownerStateChanged, this);
        }

        for(let key in this._pins) {
            let pin = this._pins[key];
            if(pin) {
                pin.setParent(this);
            }
        }
    }

    public setOwner(owner: View): this {
        if(this._owner != owner) {
            this.focusUpdateOwner(owner);
        }

        return this;
    }

    private _ownerStateChanged() {
        if(!this._locked) {
            for(let key in this._pins) {
                let pin = this._pins[key];
                if(pin) {
                    pin.onOwnerChanged();
                }
            }
        }
    }

    public get owner(): View {
        return this._owner;
    }

    public dispose(): void {
        if(this._owner) {
            this._owner.off(Events.DisplayObjectEvent.SIZE_CHANGED, this._ownerStateChanged, this);
            this._owner.off(Events.DisplayObjectEvent.XY_CHANGED, this._ownerStateChanged, this);
        }

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

    public canConnect(pinType: ERelationPinType, target: View, targetPinType?: ERelationPinType) {
        let error = "";
        if(target == this._owner) {
            error = "can not to connect self";
        }

        if(this._owner.parent != target && this._owner.parent != target.parent) {
            error = "just only support connect to parent or same parent object";
        }

        if(this._owner.parent == target && pinType != ERelationPinType.CENTER && pinType != ERelationPinType.MIDDLE) {
           let opType = Relations.getOppositeType(pinType);
           if(targetPinType == opType) {
            error = `can not connect ${relationPinTypes[pinType]} to ${relationPinTypes[targetPinType]} in nest`;
           }
        }

        if(!Relations.checkCanConnect(pinType, targetPinType)) {
            error = `can not connect ${relationPinTypes[pinType]} to ${relationPinTypes[targetPinType]}`;
        }

        return error;
    }
    
    public set(pinType: ERelationPinType, target: View, targetPinType?: ERelationPinType): RelationPin {
        targetPinType = targetPinType || pinType;
        let error = this.canConnect(pinType, target, targetPinType);
        if(error) {
            throw new Error(error);
        }

        let pin = this.getPin(pinType);
        if(pin) {
            if(pin.owner == target && (pin.to.pinType == targetPinType)) {
                  return pin;
            }else{
                this._remove(pin);
            }
        }

        pin = new RelationPin(pinType).setParent(this).setOwner(this._owner);
        this._pins[pinType] = pin;
        pin.connect(this, target, targetPinType);

        return pin;
    }

    private _remove(pin: RelationPin) {
        if(pin) {
            delete this._pins[pin.pinType];
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

    public static getSameDirectionType(pinType: ERelationPinType): ERelationPinType[]{
        switch(pinType) {
            case ERelationPinType.LEFT:
            case ERelationPinType.RIGHT:            
            case ERelationPinType.CENTER:        
                return [ERelationPinType.LEFT, ERelationPinType.RIGHT, ERelationPinType.CENTER];
            case ERelationPinType.TOP:
            case ERelationPinType.BOTTOM:
            case ERelationPinType.MIDDLE:
                return [ERelationPinType.TOP, ERelationPinType.BOTTOM, ERelationPinType.MIDDLE];
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