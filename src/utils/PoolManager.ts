export class PoolManager {
    private static _inst: PoolManager = new PoolManager();
    public static get inst(): PoolManager {
        return this._inst;
    }

    private _pools:{[key: string]: Array<any>} = {};

    private constructor() {
    }

    public getByName(name: string, typeClass: new(...args:any[])=>{}, ...args: any[]) {
        let array = this._pools[name];
        if(!array) {
            array = [];
            this._pools[name] = array;            
        }else{
            if(array.length > 0) {
                let inst = array.pop();
                if(typeof(inst.reset) === "function") {
                    inst.reset();
                }
                return inst;
            }
        }

        let ret = new typeClass(...args);
        return ret;
    }

    public get(typeClass: new(...args:any[])=>{}, ...args: any[]) {
        let name = "_sb_pool_" + typeClass.name;
        return this.getByName(name, typeClass, ...args);
    }

    public putByName(name: string, inst: any) {
        let array = this._pools[name];
        if(!array) {
            array = [];
            this._pools[name] = array;            
        }
        if(typeof(inst.recover) === "function") {
            inst.recover();
        }
        array.push(inst);
    }

    public put(...insts: any[]) {
        for(let inst of insts) {
            let name = "_sb_pool_" + inst.constructor.name;
            this.putByName(name, inst);
        }
    }
}