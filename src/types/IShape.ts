import { Graphics } from "../phaser";
import { IView } from "./IView";

export interface IShape  {
    contains(view: IView, x:number, y: number): boolean;
    draw(view: IView, graphic: Graphics): this;
}