import { IView, IViewGroup } from "../types";

export function GetPath(root: IViewGroup, target: IView) {
    let paths = [];
    let parent = target.parent;
    while(!parent && parent != root) {
        
    }
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

        //  Use for loop here so we can break early
        for (var i = 0; i < keys.length; i++)
        {
            if (parent.hasOwnProperty(keys[i]))
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
            if (parent[keys[i]] != undefined || parent.hasOwnProperty(keys[i]))
            {
                //  Yes it has a key property, let's carry on down
                value = parent[keys[i]];

                parent = parent[keys[i]];
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