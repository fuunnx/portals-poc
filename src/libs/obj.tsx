interface Dict {
    [key: string]: any,
}


export function filter(predicate: (i: any) => boolean, dict: Dict) {
    return Object.entries(dict).reduce((acc: Dict, [key, val]) => {
        if (predicate(val)) acc[key] = val

        return acc
    }, {})
}