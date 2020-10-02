import { Pointer } from "../phaser";

export class MultiPointerManager {
    private _pointerDowns: {[key:string]: any} = {};
    
    public clear() {
        this._pointerDowns = {};
    }

    public down(pointer: Pointer, data?:any) {
        this._pointerDowns[pointer.id] = data || true;
    }

    public up(pointer: Pointer) {
        delete this._pointerDowns[pointer.id];
    }

    public isDown(pointer: Pointer): boolean {
        return this._pointerDowns[pointer.id] != undefined;
    }

    public isEmpty(): boolean {
        return Object.getOwnPropertyNames(this._pointerDowns).length == 0;
    }

    public getData(pointer: Pointer): any {
        return this._pointerDowns[pointer.id];
    }
}