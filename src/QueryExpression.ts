import { ObjectArrayAccessExpression, ArrayElementProjection, GroqExpression, ArrayElementProjectionResultType, GroqObjectType, AnyTypedGroqObject, GroqExpressionContext, ObjectUnionAccessExpression, ArrayElementPredicate, ExtractParams } from "./GroqExpression";
import { GroqObjectFromObjectSchema, ObjectSchema } from "./ObjectSchema";
import { toArray, toGroq, toGroqObject, toObject } from "./utils";

export function query<TSource extends ObjectSchema<any, any>>(o: TSource): ObjectArrayAccessExpression<GroqObjectFromObjectSchema<TSource>, {}> {
    return new QueryExpression<GroqObjectFromObjectSchema<TSource>>(o, [{ __returnType: true, __params: undefined, toGroq: () => `_type == "${o.type}"` }])
}
class QueryExpression<T extends AnyTypedGroqObject<any>, TParams extends Record<string, any>={}> implements ObjectArrayAccessExpression<T, TParams> {
    __objectArrayAccess: true| undefined;
    __returnType: readonly GroqObjectType<T>[]| undefined;
    __params: undefined;
    private readonly object: any;    
    
    constructor(private readonly schema: ObjectSchema<any, any>, private readonly predicates: readonly GroqExpression<boolean, any>[]) { 
        this.object = toGroqObject(this.schema);
    }

    map<TProjection extends ArrayElementProjection<T>>(projection: TProjection): GroqExpression<readonly ArrayElementProjectionResultType<TProjection>[], TParams & ExtractParams<ReturnType<TProjection>>> {
        const projectionResult = projection(this.object);
        return new MappedQueryExpression<ArrayElementProjectionResultType<TProjection>, ExtractParams<ReturnType<TProjection>>>(this, projectionResult);
    }

    filter<TPredicate extends ArrayElementPredicate<T>>(predicate: TPredicate): ObjectArrayAccessExpression<T, TParams & ExtractParams<ReturnType<TPredicate>>> {
        return new QueryExpression<T, TParams & ExtractParams<ReturnType<TPredicate>>>(this.schema, [...this.predicates, predicate(this.object)]);
    }

    toGroq(depth: number = 0, context?: GroqExpressionContext): string {
        const predicates = this.predicates.map(p => p.toGroq()).join(' && ');
        if (depth === 0)
            return `*[${predicates}] { ... }`
        return `*[${predicates}]`
    }
}

class MappedQueryExpression<T, TParams extends Record<string, any>> implements GroqExpression<readonly T[], TParams> {
    __returnType: readonly T[] | undefined;
    __params: undefined;
    constructor(private readonly queryExpression : GroqExpression<any, any>, private readonly projectionResult: any) { }
    toGroq(depth: number = 0, context?: GroqExpressionContext): string {
        return `${this.queryExpression.toGroq(depth + 1)} ${toGroq(this.projectionResult, 'array-map')}`
    }
}