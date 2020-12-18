import { Graphics } from "../phaser";
import { IView } from "./IView";

export interface IShape  {
    hitTest(): boolean;
    draw(view: IView, graphic: Graphics, style: any): this;
}