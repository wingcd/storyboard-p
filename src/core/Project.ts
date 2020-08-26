import { Serialize, Deserialize } from "../utils/Serialize";

export class Project {
    

    public toJSON(): any {
        return Serialize(this);
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            Deserialize(this, config, template);
        }        

        return this;
    }
}