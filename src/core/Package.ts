import { PackageItem } from "./PackageItem";
import { randomString } from "../utils/String";
import { ITemplatable } from "../types/ITemplatable";
import { ECategoryType } from "./Defines";
import { ViewScene } from "./ViewScene";
import { PropertyManager } from "../tween/Property";

export class Package {
    private static _sid = 0;

    private static _packagesById: {[key:string]: PackageItem} = {};
    private static _packagesByName: {[key:string]: PackageItem} = {};

    public static getUniqueID() {
        return ++Package._sid;
    }

    public static genPackageKey() {
        let key = "";
        do{
            key = randomString(5)
        }
        while(Package._packagesById[key]);
        return key;
    }

    public static addPackage(pkg: PackageItem) {
        if(!this._packagesById[pkg.id]) {
            this._packagesById[pkg.id] = pkg;
            this._packagesByName[pkg.name] = pkg;
        }
    }    

    public static getTemplateUrl(pkgName: string, tempName: string) {
        let pkg = Package._packagesByName[pkgName];
        if(!pkg) {
            return null;
        }

        let item = pkg.getTemplate(tempName);
        if(!item) {
            return null;
        }

        return `res://${pkg.id}/${item.id}`;
    }

    public static getTemplateFromUrl(url: string): ITemplatable {
        if(!url.startsWith("res://")) {
            return null;
        }

        url = url.replace("res://", "");
        let strs = url.split("/");
        return Package.getTemplate(strs[0], strs[1]);
    }

    public static getTemplate(pkgId: string, tempName: string): ITemplatable {
        let pkg = Package._packagesById[pkgId];
        if(!pkg) {
            return null;
        }

        return pkg.getTemplate(tempName);
    }

    public static createObjectFromUrl(scene:ViewScene, url: string): ITemplatable {
        if(!url) {
            return null;
        }

        let data = Package.getTemplateFromUrl(url) as any;
        if(!data) {
            return null;
        }

        let result: any;
        switch(data.category) {
            case ECategoryType.View:
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

    public static createObject(scene:ViewScene, data: any): ITemplatable {
        if(!data.category && !data.resourceUrl) {
            return null;
        }

        let temp = data;
        let cfg = null;
        if(data.resourceUrl) {
            temp = Package.getTemplateFromUrl(data.resourceUrl);
            if(temp) {
                cfg = data;
            }
        }

        let category = data.category || temp ? temp.category : null;
        switch(category) {
            case ECategoryType.View:
                return scene.addUI.create(data, temp);
            case ECategoryType.Property:
                return new PropertyManager().fromJSON(data, temp);
        }
    } 
}