export class SEvent {
    type: string;
    sender: any;
    raw: any;
    data: any;
}

var TEMP_EVENT: SEvent = new SEvent();

export function CreateEvent(type: string, sender: any, raw: any, data?: any): SEvent {
    let event = new SEvent();
    event.type = type;
    event.sender = sender;
    event.raw = raw;
    event.data = data;
    return event;
}