import { ObjectArrayAccessExpression, ArrayElementProjection, GroqExpression, ArrayElementProjectionResultType, GroqObjectType, AnyTypedGroqObject, ObjectAccessExpression } from "./GroqExpression";
import { ObjectSchema, GroqObjectFromSchema } from "./ObjectSchema";
import { toArray, toGroqObject, toObject } from "./utils";

export function query<TSource extends ObjectSchema<any, any>>(o: TSource): ObjectArrayAccessExpression<GroqObjectFromSchema<TSource>> {
    return new QueryExpression<GroqObjectFromSchema<TSource>>(o)
}

class QueryExpression<T extends AnyTypedGroqObject<any>> implements ObjectArrayAccessExpression<T> {
    __objectArrayAccess: true| undefined;
    __returnType: readonly GroqObjectType<T>[]| undefined;
    constructor(private readonly schema: ObjectSchema<any, any>) { }

    map<TProjection extends ArrayElementProjection<T>>(projection: TProjection): GroqExpression<readonly ArrayElementProjectionResultType<TProjection>[]> {
        const projectionArg : any = toGroqObject(this.schema);
        const projectionResult = projection(projectionArg);
        return new MappedQueryExpression<ArrayElementProjectionResultType<TProjection>>(this, projectionResult);
    }
    toGroq(): string {
        return `*[_type == "${this.schema.type}"]`
    }
}

class MappedQueryExpression<T> implements GroqExpression<readonly T[]> {
    __returnType: readonly T[] | undefined;
    constructor(private readonly queryExpression : GroqExpression<any>, private readonly projection: any) { }
    toGroq(d: number = 0): string {
        return `${this.queryExpression.toGroq(d+1)}{${toArray(this.projection).map(([k, v]) => `${k}: ${v.toGroq(d+1)}`).join(', ')}}`
    }
}