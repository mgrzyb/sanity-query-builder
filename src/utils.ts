export function toObject<T extends Record<string, any>>(arr: [string, any][]) {
    return arr.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as T);
}export function toArray<T extends Record<string, any>>(obj: T) {
    return Object.keys(obj).map(k => [k, obj[k]]) as [string, any][];
}

