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