import { ObjectArrayAccessExpression, ArrayElementProjection, GroqExpression, ArrayElementProjectionResultType, GroqObjectType, AnyTypedGroqObject, GroqExpressionContext, ObjectUnionAccessExpression, ArrayElementPredicate } from "./GroqExpression";
import { GroqObjectFromObjectSchema, ObjectSchema } from "./ObjectSchema";
import { toArray, toGroq, toGroqObject, toObject } from "./utils";

export function query<TSource extends ObjectSchema<any, any>>(o: TSource): ObjectArrayAccessExpression<GroqObjectFromObjectSchema<TSource>> {
    return new QueryExpression<GroqObjectFromObjectSchema<TSource>>(o)
}
class QueryExpression<T extends AnyTypedGroqObject<any>> implements ObjectArrayAccessExpression<T> {
    __objectArrayAccess: true| undefined;
    __returnType: readonly GroqObjectType<T>[]| undefined;
    private readonly object: any;
    private readonly predicates: GroqExpression<boolean>[] = [];
    constructor(private readonly schema: ObjectSchema<any, any>) { 
        this.object = toGroqObject(this.schema);
        this.predicates.push({ __returnType: true, toGroq: () => `_type == "${this.schema.type}"` })
    }

    map<TProjection extends ArrayElementProjection<T>>(projection: TProjection): GroqExpression<readonly ArrayElementProjectionResultType<TProjection>[]> {
        const projectionResult = projection(this.object);
        return new MappedQueryExpression<ArrayElementProjectionResultType<TProjection>>(this, projectionResult);
    }

    filter(predicate: ArrayElementPredicate<T>): ObjectArrayAccessExpression<T> {
        this.predicates.push(predicate(this.object));
        return this;
    }

    toGroq(depth: number = 0, context?: GroqExpressionContext): string {
        const predicates = this.predicates.map(p => p.toGroq()).join(' && ');
        if (depth === 0)
            return `*[${predicates}] { ... }`
        return `*[${predicates}]`
    }
}

class MappedQueryExpression<T> implements GroqExpression<readonly T[]> {
    __returnType: readonly T[] | undefined;
    constructor(private readonly queryExpression : GroqExpression<any>, private readonly projectionResult: any) { }
    toGroq(depth: number = 0, context?: GroqExpressionContext): string {
        return `${this.queryExpression.toGroq(depth + 1)} ${toGroq(this.projectionResult, 'array-map')}`
    }
}