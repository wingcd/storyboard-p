import { IMetadatable, IMetadataInfo } from "../types/IMeta";
import { Data } from "phaser";
import { randomString } from "../utils/String";

export class DataDB {
    private static _db: {[key:string]: any} = {};
    private static _tempDB: {[key:string]: any} = {};

    public static genKey(): string {
        let key = "";
        do{
            key = randomString(4)
        }
        while(this._db[key]);
        return key;
    }

    public static getKey(metadata: IMetadataInfo): string {        
        return `${metadata.uniqueType}:${metadata.uid}`;
    }

    public static getByKey(key: string): any {
        return this._db[key];
    }
    
    public static put(obj: IMetadatable, replace?: boolean) {
        if(obj) {
            let metadata = obj.getMetadata();
            let key = DataDB.getKey(metadata);
            if(!replace && DataDB.getByKey(key)) {
                console.error(`already has data with key:${key}!`);
                return;
            }
            this._db[key] = obj;
        }
    }

    public static get(metadata: IMetadataInfo): any {
        let key = DataDB.getKey(metadata);
        return DataDB.getByKey(key);
    }

    public static remove(obj: IMetadatable): boolean {
        let metadata = obj.getMetadata();
        let key = DataDB.getKey(metadata);
        if(DataDB._db[key]) {
            delete DataDB._db[key];
            return true;
        }
        return false;
    }    

    public static putTemp(obj: IMetadatable, replace?: boolean) {
        if(obj) {
            let metadata = obj.getMetadata();
            let key = DataDB.getKey(metadata);
            if(!replace && DataDB._tempDB[key]) {
                console.error(`already has temp data with key:${key}!`);
                return;
            }
            DataDB._tempDB[key] = obj;
        }
    }

    public static removeTemp(obj: IMetadatable) {
        let metadata = obj.getMetadata();
        let key = DataDB.getKey(metadata);
        delete DataDB._tempDB[key];
    }

    public static clearTemp() {
        DataDB._tempDB = {};
    }
}