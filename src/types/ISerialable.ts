export interface ISerialable {
    toJSON(): any;
    fromJSON(config: any, template?: any): this;
}