import { randomString } from "../utils/String";
import { ECategoryType } from "./Defines";
import { ViewScene } from "./ViewScene";
import { ITemplatable } from "../types/ITemplatable";
import { Package } from "./Package";

export class PackageItem {
    public name: string = "DEFAULT";
    private _id: string;    
    private _templates: {[key:string]: ITemplatable}={};

    constructor() {
        this._id = Package.genPackageKey();
    }

    public get id(): string {
        return this._id;
    }

    public genKey(): string {
        let key = "";
        do{
            key = randomString(5)
        }
        while(this._templates[key]);
        return key;
    }

    public addTemplate(template: ITemplatable): string {
        this._templates[template.id] = template;
        return Package.getTemplateUrl(this.name, template.id);
    }

    public getTemplate(name:string): ITemplatable {
        return this._templates[name];
    }

    public getAllTemplates(): any[] {
        let rets = [];
        for(let i in this._templates) {
            let t = this._templates[i];
            rets.push(t);
        }
        return rets;
    }

    public createObject(scene: ViewScene, data: any) {
        if(data.category) {
            switch(data.category) {
                case ECategoryType.View:
                    let temp = null;
                    if(data.resourceUrl) {
                        
                    }
                    scene.addUI.create(data);
                    break;
                case ECategoryType.Property:
                    break;
                case ECategoryType.Animation:
                    break;
            }
        }
    }

}