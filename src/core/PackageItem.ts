import { randomString } from "../utils/String";
import { ECategoryType } from "./Defines";
import { ViewScene } from "./ViewScene";
import { ITemplatable } from "../types/ITemplatable";
import { Package } from "./Package";
import { ISerializeInfo } from "../annotations/Serialize";

export class PackageItem {
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields:ISerializeInfo[] = [];
        fields.push(
            {property: "name", default: null},      
            {property: "_id", alias: "id", default: null},  
            {property: "_templates", alias: "templates", default: null, raw: true},
        );
        return fields;
    }

    static DESERIALIZE_COMPLETED(source: any, target: any, tpl: any, depth: number) {
        if(target instanceof PackageItem) {
            let templates = target._templates.slice();
            target._templates.length = 0;
            for(let t of templates) {
                target.addTemplate(t);
            }
        }
    }

    public name: string = "DEFAULT";
    private _id: string;    
    private _templates: ITemplatable[] = [];
    private _templatesById: {[key:string]: ITemplatable}={};

    constructor() {
        this._id = Package.inst.genPackageKey();
    }

    public get id(): string {
        return this._id;
    }

    public genKey(): string {
        let key = "";
        do{
            key = randomString(6, true, false, false);
        }
        while(this._templatesById[key]);
        return key;
    }

    public addTemplate(template: ITemplatable): string {
        if(!this._templatesById[template.id]) {
            this._templatesById[template.id] = template;
            this._templates.push(template);
        }
        return Package.inst.getTemplateUrl(this.name, template.id);
    }

    public removeTemplate(template: ITemplatable) {
        this.removeTemplateById(template.id);
    }

    public removeTemplateById(id: string) {
        delete this._templatesById[id];
        let idx = this._templates.findIndex((item)=>item.id == id);
        if(idx >= 0) {
            this._templates.splice(idx, 1);
        }
    }

    public getTemplate(id: string): ITemplatable {
        return this._templatesById[id];
    }

    public getAllTemplates(): ITemplatable[] {
        return this._templates;
    }
}