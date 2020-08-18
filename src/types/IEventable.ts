export interface IEventable {    
    on(type: string, listener: Function, thisObject?: any): this;
    off(type: string, listener: Function, thisObject?: any): this;
    once(type: string, listener: Function, thisObject?: any): this;
    hasListener(event: string, handler?:Function): boolean;
    emit(event: string, ...args: any[]): boolean;
    removeAllListeners(type?:string): this;
    onClick(listener: Function, thisObj?: any): this;
    removeClick(listener: Function, thisObj?: any): this;
    hasClick(fn?:Function): boolean;
}