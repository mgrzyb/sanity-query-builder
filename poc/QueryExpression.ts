import { ObjectArrayAccessExpression, ArrayElementProjection, GroqExpression, ArrayElementProjectionResultType, GroqObjectType, AnyTypedGroqObject, GroqExpressionContext } from "./GroqExpression";
import { GroqObjectFromObjectSchema, ObjectSchema } from "./ObjectSchema";
import { toArray, toGroq, toGroqObject, toObject } from "./utils";

export function query<TSource extends ObjectSchema<any, any>>(o: TSource): ObjectArrayAccessExpression<GroqObjectFromObjectSchema<TSource>> {
    return new QueryExpression<GroqObjectFromObjectSchema<TSource>>(o)
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
    toGroq(depth: number = 0, context?: GroqExpressionContext): string {
        if (depth === 0)
            return `*[_type == "${this.schema.type}"] { ... }`
        return `*[_type == "${this.schema.type}"]`
    }
}

class MappedQueryExpression<T> implements GroqExpression<readonly T[]> {
    __returnType: readonly T[] | undefined;
    constructor(private readonly queryExpression : GroqExpression<any>, private readonly projectionResult: any) { }
    toGroq(depth: number = 0, context?: GroqExpressionContext): string {
        return `${this.queryExpression.toGroq(depth + 1)} ${toGroq(this.projectionResult, 'array-map')}`
    }
}