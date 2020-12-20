import { Graphics } from "../phaser";
import { ISerialable } from "./ISerialable";
import { IView } from "./IView";

export interface IShape extends ISerialable{
    contains(view: IView, x:number, y: number): boolean;
    draw(view: IView, graphic: Graphics): this;
}