import { IClonable } from "./IClonable";
import { ISerialable } from "./ISerialable";

export interface ITemplatable extends ISerialable, IClonable {
    id: string;
    resourceUrl: string;
}