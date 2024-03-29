import { ExpressionFromField, FieldAccessExpression, FieldBase } from "./Field";
import { ReferenceAccessExpression, ResolvedReferenceProjection, GroqExpression, GroqExpressionType, GroqObjectType, AnyTypedGroqObject, ObjectUnionAccessExpression, GroqExpressionOrObject, ConditionalExpression, Ref, GroqExpressionContext } from "./GroqExpression";
import { ObjectSchema, GroqObjectFromObjectSchema } from "./ObjectSchema";
import { SimpleFieldAccessExpression } from "./SimpleField";
import { toArray, toGroq, toGroqObject } from "./utils";

export class ReferenceField<TObjectsSchemaUnion extends ObjectSchema<any, any>> extends FieldBase<ReferenceAccessExpression<GroqObjectFromObjectSchema<TObjectsSchemaUnion>>> {
    constructor(private readonly schemas: TObjectsSchemaUnion[]) { super() }
    getExpression(name: string, objectAccessExpression?: GroqExpression<any>) {
        return new ReferenceFieldAccessExpression<TObjectsSchemaUnion>(name, this.schemas, objectAccessExpression);
    }
}

class ReferenceFieldAccessExpression<TObjectSchamasUnion extends ObjectSchema<any, any>> extends FieldAccessExpression implements ReferenceAccessExpression<GroqObjectFromObjectSchema<TObjectSchamasUnion>> {
    __referenceAccess: true| undefined;
    __returnType: Ref | undefined;
    constructor(fieldName: string, private readonly schemas: TObjectSchamasUnion[], objectAccessExpression?: GroqExpression<any>) {
        super(fieldName, objectAccessExpression);
     }
    resolve<TProjection extends ResolvedReferenceProjection<GroqObjectFromObjectSchema<TObjectSchamasUnion>>>(projection: TProjection): GroqExpression<GroqExpressionType<ReturnType<TProjection>>> {
        const arg = new ProjectionAgr<GroqObjectFromObjectSchema<TObjectSchamasUnion>>(this.schemas.map(s => toGroqObject(s)));
        const projectionResult = projection(arg as any);
        return new ResolvedReferenceExpression<GroqExpressionType<ReturnType<TProjection>>>(this, projectionResult);
    }
}

class ProjectionAgr<TObjectsUnion extends AnyTypedGroqObject<any>> implements ObjectUnionAccessExpression<TObjectsUnion> {
    __objectUnionAccess: true | undefined;
    constructor(private readonly elements: TObjectsUnion[]) { 
        // TODO: extract common fields from elements
        (this as any)["_type"] = new SimpleFieldAccessExpression<string>('_type');
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
    __returnType: GroqObjectType<TObjectsUnion> | undefined;
    toGroq(depth?: number, context?: GroqExpressionContext): string {
        return "{...}"
    }
    
}

class IsTypeExpression<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"]>; } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]>; }) => any> implements ConditionalExpression<GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"]; }> {
    _conditionalAccess: true | undefined;
    __returnType: (GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"]; }) | undefined;
    constructor(private readonly elements: ObjectUnionAccessExpression<any>, private readonly type: T, private readonly projectionResult: GroqExpressionOrObject) { }
    toGroq(depth?: number, context?: GroqExpressionContext): string {
        return `_type == '${this.type.type}' => ${toGroq(this.projectionResult)}`
    }
}

class ResolvedReferenceExpression<T> implements GroqExpression<T> {
    __returnType: T | undefined;
    constructor(private readonly queryExpression : GroqExpression<any>, private readonly projectionResult: any) { }
    toGroq(depth: number = 0, context?: GroqExpressionContext): string {
        return `${this.queryExpression.toGroq(depth + 1)}->${toGroq(this.projectionResult)}`
    }
}