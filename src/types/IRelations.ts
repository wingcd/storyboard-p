import { IView } from ".";

export const enum ERelationPinType {
    LEFT,
    RIGHT,
    TOP,
    BOTTOM,
    CENTER,
    MIDDLE,
}

export interface IRelationPin {
    to: IRelationPin;
    pinType: ERelationPinType;
    owner: IView;
    precent: boolean;

    connect(relations: IRelations, target: IView, targetPinType: ERelationPinType): this;
    disconnect(): this;
}

export interface IRelationsConfig {

}

export interface IRelations extends IRelationsConfig {
    pins:{
        [key: string]: IRelationPin;
    };
    
    dispose(): void;
    getPin(pinType: ERelationPinType): IRelationPin;
    set(pinType: ERelationPinType, target: IView, targetPinType?: ERelationPinType): IRelationPin;
    clear(): this;
    remove(pinType: ERelationPinType): this;

    /**
     * @internal
     */
    getOppositePin(pinType: ERelationPinType): IRelationPin;
}