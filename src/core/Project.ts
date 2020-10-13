import { Serialize, Deserialize } from "../utils/Serialize";

export class Project {
    

    public toJSON(tpl?: any): any {
        return Serialize(this, tpl);
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            Deserialize(this, config, template);
        }        

        return this;
    }
}