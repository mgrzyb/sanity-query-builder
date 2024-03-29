import { GroqExpression, GroqExpressionContext, GroqExpressionOrObject } from "./GroqExpression";
import { ObjectSchema } from "./ObjectSchema";

export function toObject<T extends Record<string, any>>(arr: [string, any][]) {
    return arr.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as T);
}

export function toArray<T extends Record<string, any>>(obj: T) {
    return Object.keys(obj).map(k => [k, obj[k]]) as [string, T[string]][];
}

export function toGroqObject(schema: ObjectSchema<any, any>): any {
    return toObject(toArray(schema.fields).map(([k, v]) => [k, v.getExpression(k)]));
}

export function toGroq(a: GroqExpressionOrObject, context?: GroqExpressionContext): any {
    if (typeof a === 'string') return `"${a}"`;
    if (typeof a === 'number') return `"${a}"`;
    if (typeof a === 'boolean') return a;
    if (isGroqExpression(a)) return a.toGroq(0, context);
    if (context === 'union') 
        return toArray(a).map(([k, v]) => `"${k}": ${toGroq(v as any, 'projection')}`).join(", ");
    return `{${toArray(a).map(([k, v]) => `"${k}": ${toGroq(v as any, 'projection')}`).join(", ")}}`;
}

export function isGroqExpression(a: Record<string, any> | GroqExpression<any> | string | number | boolean) : a is Pick<GroqExpression<any>, 'toGroq' | 'isProjection'> {
    if (typeof a === 'string') return false;
    if (typeof a === 'number') return false;
    if (typeof a === 'boolean') return false;
    return (a as any).toGroq;
}
