import { PackageItem } from "./PackageItem";
import { randomString } from "../utils/String";
import { ITemplatable } from "../types";
import { ViewScene } from "./ViewScene";
import { ISerializeFields } from "../types";
import { Templates } from "./Templates";

export class Package {
    static SERIALIZABLE_FIELDS: ISerializeFields = {
        packages: {property: "_packages", type: PackageItem},
    };

    protected constructFromJson() {
        let packages = this._packages.slice();
        this._packages.length = 0;
        for(let t of packages) {
            this.addPackage(t);
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

    public getTemplateUrl(pkgName: string, tempName: string): string {
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

        let tpl = this.getTemplateFromUrl(url) as any;
        if(!tpl) {
            return null;
        }

        let result = Templates.createFromData(scene, tpl);

        if(result) {
            result.resourceUrl = url;
        }
        return result;
    } 

    public createObjectFromData(scene:ViewScene, data: any): ITemplatable {
        if(!data.__category__ && !data.resourceUrl) {
            return null;
        }

        let tpl: any = null;
        if(data.resourceUrl) {
            tpl = this.getTemplateFromUrl(data.resourceUrl);
        }

        return Templates.createFromData(scene, data, tpl);
    }

    public createObject(scene:ViewScene, data: string|object): ITemplatable {
        if(typeof(data) === 'string') {
            return this.createObjectFromUrl(scene, data);
        }else{
            return this.createObjectFromData(scene, data);
        }
    }
}