import { IView, IViewGroup } from "../types";

let nameIndexRegex = new RegExp(/^(\w*?)\[(\w+?)\]$/);
let indexRegex = new RegExp(/^(\w*?)\[(\d+?)\]$/);

export function IsViewChild(root: IView, target: IView) {
    if(!root || !target) {
        return false;
    }

    if(root == target) {
        return true;
    }

    let parent = target;
    while(parent) {
        parent = parent.parent;
        if(root == parent) {
            return true;
        }
    }
    
    return false;
}

export function GetViewRelativePath(root: IView, target: IView) {
    if(!root || !target) {
        return "";
    }

    if(!IsViewChild(root, target)) {
        console.error("target view is not child of root view!")
        return "";
    }

    let paths = [];
    while(target && target != root) {
        paths.push(target.name);
        target = target.parent;
    }
    return paths.reverse().join("/");
}

export function GetViewByRelativePath(root: IView, path: string): IView {
    if(!root || !path) {
        return root;
    }

    let child = root;
    let paths = path.split("/");
    for(let p of paths) {
        if(!(child as any).getChild) {
            console.error(`invalid path ${path} in ${p}:not group view!`);
            return child;
        }

        let c = (child as any).getChild(p) as IViewGroup;

        if(!c) {
            console.error(`invalid path ${path} in ${p}:can not find child!`);
            return c;
        }
        child = c;
    }
    return child;
}

function getArrayItem(parent: any, key: string) {
    let ret: any = null;
    let match = indexRegex.exec(key);
    if(match) {
        let items = parent[match[1] || "children"];
        if(items) {
            for(let vi in items) {
                if(vi == match[2]) {
                    ret = items[vi];
                    break;
                }
            }
        }                    
        if(!ret) {
            console.error("can not get value by path:" + key);
        }
    }else{                      
        match = nameIndexRegex.exec(key); 
        if(match) {
            let items = parent[match[1] || "children"];
            if(items) {
                for(let vi in items) {
                    let item = items[vi];
                    if(item && item.name == match[2]) {
                        ret = item;
                        break;
                    }
                }
            }

            if(!ret) {
                console.error("can not get value by path:" + key);
            }
        }
    }
    return ret;
}

export function SetValue(source: any, key: string, value: any, checkProp: boolean = false)
{
    if (!source || typeof source === 'number')
    {
        return false;
    }
    else if (key.indexOf('.') !== -1)
    {
        var keys = key.split('.');
        var parent = source;
        var prev = source;

        for (var i = 0; i < keys.length; i++)
        {
            let item = getArrayItem(parent, keys[i]);
            if(item) {
                parent = item;
                continue;
            }

            if (!checkProp || checkProp && parent.hasOwnProperty(keys[i]))
            {
                //  Yes it has a key property, let's carry on down
                prev = parent;
                parent = parent[keys[i]];
            }
            else
            {
                return false;
            }
        }

        prev[keys[keys.length - 1]] = value;

        return true;
    } 
    else if (!checkProp || checkProp && source.hasOwnProperty(key))
    {
        source[key] = value;

        return true;
    }
    
    return false;
};

/**
 * 
 * @param source 
 * @param key 
 * @param defaultValue 
 * @param back 回退一个属性，获取上一级对象
 */
export function GetValue(source: any, key: string, defaultValue?: any, back?: boolean)
{
    let defaultV = back ? source : defaultValue;

    if (!source || typeof source === 'number')
    {
        return defaultV;
    }
    else if (source.hasOwnProperty(key))
    {
        return source[key];
    }
    else if (key.indexOf('.') !== -1)
    {
        var keys = key.split('.');
        var parent = source;
        var value = defaultV;

        //  Use for loop here so we can break early
        let backstep = back ? 1 : 0;

        for (var i = 0; i < keys.length - backstep; i++)
        {
            let item = getArrayItem(parent, keys[i]);
            if(item) {
                value = item;
                continue;
            }

            if (parent[key] != undefined || parent.hasOwnProperty(keys[i]))
            {
                //  Yes it has a key property, let's carry on down
                value = parent[key];

                parent = parent[key];
            }
            else
            {
                //  Can't go any further, so reset to default
                value = defaultValue;
                break;
            }
        }

        return value;
    }
    else
    {
        return defaultV;
    }
};