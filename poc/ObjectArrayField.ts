import { ExpressionFromField, Field, FieldBase } from "./Field";
import { ObjectArrayAccessExpression, AnyTypedGroqObject, GroqExpression, ArrayElementProjection, ArrayElementProjectionResultType, GroqObjectType, ObjectAccessExpression, ObjectUnionAccessExpression, ConditionalExpression, GroqExpressionType, GroqExpressionOrObject } from "./GroqExpression";
import { ObjectSchema, GroqObjectFromSchema } from "./ObjectSchema";
import { toArray, toGroq, toGroqObject } from "./utils";

export class ObjectArrayField<TElementSchemaUnion extends ObjectSchema<any, any>> extends FieldBase<ObjectArrayAccessExpression<GroqObjectFromSchema<TElementSchemaUnion>>> {
    constructor(private readonly elementSchemas: TElementSchemaUnion[]) { super() }

    getExpression(name: string, objectAccessExpression?: ObjectAccessExpression<any>) {
        return new ObjectArrayFieldAccessExpression<GroqObjectFromSchema<TElementSchemaUnion>>(name, this.elementSchemas.map(s => toGroqObject(s)), objectAccessExpression);
    }
}

class ObjectArrayFieldAccessExpression<TElementsUnion extends AnyTypedGroqObject<any>> implements ObjectArrayAccessExpression<TElementsUnion> {
    __objectArrayAccess: true| undefined;
    __returnType: readonly GroqObjectType<TElementsUnion>[]| undefined;
    constructor(private readonly fieldName : string, private readonly elements: TElementsUnion[], private readonly objectAccessExpression?: GroqExpression<any>) { }
    map<TProjection extends ArrayElementProjection<TElementsUnion>>(projection: TProjection): GroqExpression<readonly ArrayElementProjectionResultType<TProjection>[]> {
        const arg = new ProjectionAgr<TElementsUnion>(this.elements);
        const projectionResult = projection(arg as any);
        return new MappedArrayExpression<ArrayElementProjectionResultType<TProjection>>(this, projectionResult);
    }
    toGroq(d: number) {
        if (this.objectAccessExpression)
            return `${this.objectAccessExpression.toGroq(d+1)}.${this.fieldName}`
        return this.fieldName
    }
}

class ProjectionAgr<TElementsUnion extends AnyTypedGroqObject<any>> implements ObjectUnionAccessExpression<TElementsUnion> {
    __objectUnionAccess: true | undefined;
    constructor(private readonly elements: TElementsUnion[]) { 
        // TODO: extract common fields from elements
        for (const e of elements) {
            for (const [k, v] of toArray(e)) {
                (this as any)[k] = v
            }
        }
    }

    is<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"]>; } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]>; }) => any>(type: T, projection: TProjection): ConditionalExpression<GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"]; }> {
        const projectionResult = projection({ _type: type.type, ...this as any });
        return new IsTypeExpression(this, type, projectionResult)
    }
    __returnType: GroqObjectType<TElementsUnion> | undefined;
    toGroq(d?: number | undefined): string {
        return "{...}"
    }
}

class IsTypeExpression<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"]>; } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]>; }) => any> implements ConditionalExpression<GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"]; }> {
    _conditionalAccess: true | undefined;
    __returnType: (GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"]; }) | undefined;
    constructor(private readonly elements: ObjectUnionAccessExpression<any>, private readonly type: T, private readonly projectionResult: GroqExpressionOrObject) { }
    toGroq(d?: number | undefined): string {
        return `_type == '${this.type.type}' => ${toGroq(this.projectionResult)}`
    }
}
class MappedArrayExpression<T> implements GroqExpression<readonly T[]> {
    __returnType: readonly T[] | undefined;
    constructor(private readonly fieldAccessExpression : GroqExpression<any>, private readonly projectionResult: any) { }
    toGroq(d: number = 0): string {
        return `${this.fieldAccessExpression.toGroq(d+1)}[] ${toGroq(this.projectionResult)}`
    }
}