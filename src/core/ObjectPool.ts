import { IMetadataInfo } from "../types/IMeta";

export class ObjectPool {
    private _sid: number = 0;
    private _id: number;
    private _objects: {[id:number]:IMetadataInfo}[] = [];

    public genID() {
        return ++ this._sid;
    }


}