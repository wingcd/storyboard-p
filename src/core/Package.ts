import { PackageItem } from "./PackageItem";
import { randomString } from "../utils/String";
import { ITemplatable } from "../types/ITemplatable";
import { ECategoryType } from "./Defines";
import { ViewScene } from "./ViewScene";
import { PropertyManager } from "../tween/Property";
import { ISerializeInfo } from "../annotations/Serialize";

export class Package {
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields:ISerializeInfo[] = [];
        fields.push(
            {property: "_packages", alias: "packages", default: null, type: PackageItem},
        );
        return fields;
    }

    static DESERIALIZE_COMPLETED(source: any, target: any, tpl: any, depth: number) {
        if(target instanceof Package) {
            let packages = target._packages.slice();
            target._packages.length = 0;
            for(let t of packages) {
                target.addPackage(t);
            }
        }
    }

    private static _inst: Package = new Package();
    public static get inst(): Package {
        return Package._inst;
    }

    private static _sid = 0;

    private _packages: PackageItem[] = [];
    private _packagesById: {[key:string]: PackageItem} = {};
    private _packagesByName: {[key:string]: PackageItem} = {};

    public static getUniqueID() {
        return ++Package._sid;
    }

    public genPackageKey() {
        let key = "";
        do{
            key = randomString(6, true, false, false);
        }
        while(this._packagesById[key]);
        return key;
    }

    public addPackage(pkg: PackageItem) {
        if(!this._packagesById[pkg.id]) {
            this._packagesById[pkg.id] = pkg;
            this._packagesByName[pkg.name] = pkg;
            this._packages.push(pkg);
        }
    }    

    public getTemplateUrl(pkgName: string, tempName: string) {
        let pkg = this._packagesByName[pkgName];
        if(!pkg) {
            return null;
        }

        let item = pkg.getTemplate(tempName);
        if(!item) {
            return null;
        }

        return `res://${pkg.id}/${item.id}`;
    }

    public getTemplateFromUrl(url: string): ITemplatable {
        if(!url.startsWith("res://")) {
            return null;
        }

        url = url.replace("res://", "");
        let strs = url.split("/");
        return this.getTemplate(strs[0], strs[1]);
    }

    public getTemplate(pkgId: string, tempName: string): ITemplatable {
        let pkg = this._packagesById[pkgId];
        if(!pkg) {
            return null;
        }

        return pkg.getTemplate(tempName);
    }

    public createObjectFromUrl(scene:ViewScene, url: string): ITemplatable {
        if(!url) {
            return null;
        }

        let data = this.getTemplateFromUrl(url) as any;
        if(!data) {
            return null;
        }

        let result: any;
        switch(data.__category__) {
            case ECategoryType.UI:
                result = scene.addUI.create(data);
                break;
            case ECategoryType.Property:
                result = new PropertyManager().fromJSON(data);
                break;
        }

        if(result) {
            result.resourceUrl = url;
        }
        return result;
    } 

    public createObjectFromData(scene:ViewScene, data: any): ITemplatable {
        if(!data.__category__ && !data.resourceUrl) {
            return null;
        }

        let temp = data;
        if(data.resourceUrl) {
            temp = this.getTemplateFromUrl(data.resourceUrl);
        }

        let category = data.__category__ || temp ? temp.__category__ : null;
        switch(category) {
            case ECategoryType.UI:
                return scene.addUI.create(data, temp);
            case ECategoryType.Property:
                return new PropertyManager().fromJSON(data, temp);
        }
    }

    public createObject(scene:ViewScene, data: string|object): ITemplatable {
        if(typeof(data) === 'string') {
            return this.createObjectFromUrl(scene, data);
        }else{
            return this.createObjectFromData(scene, data);
        }
    }
}