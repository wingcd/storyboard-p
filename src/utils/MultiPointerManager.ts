import { Pointer } from "../phaser";

export class MultiPointerManager {
    private _pointerDowns: {[key:string]:boolean} = {};
    
    public clear() {
        this._pointerDowns = {};
    }

    public down(pointer: Pointer) {
        this._pointerDowns[pointer.id] = true;
    }

    public up(pointer: Pointer) {
        delete this._pointerDowns[pointer.id];
    }

    public isDown(pointer: Pointer): boolean {
        return !!this._pointerDowns[pointer.id];
    }

    public isEmpty(): boolean {
        return Object.getOwnPropertyNames(this._pointerDowns).length == 0;
    }
}