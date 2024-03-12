import { ExpressionFromField, FieldBase } from "./Field";
import { ReferenceAccessExpression, ResolvedReferenceProjection, GroqExpression, GroqExpressionType, GroqObjectType, AnyTypedGroqObject, ObjectUnionAccessExpression, GroqExpressionOrObject, ConditionalExpression } from "./GroqExpression";
import { ObjectSchema, GroqObjectFromSchema } from "./ObjectSchema";
import { toArray, toGroq, toGroqObject } from "./utils";

export class ReferenceField<TObjectsSchemaUnion extends ObjectSchema<any, any>> extends FieldBase<ReferenceAccessExpression<GroqObjectFromSchema<TObjectsSchemaUnion>>> {
    constructor(private readonly schemas: TObjectsSchemaUnion[]) { super() }
    getExpression(name: string, objectAccessExpression?: GroqExpression<any>) {
        return new ReferenceFieldAccessExpression<TObjectsSchemaUnion>(name, this.schemas, objectAccessExpression);
    }
}

class ReferenceFieldAccessExpression<TObjectSchamasUnion extends ObjectSchema<any, any>> implements ReferenceAccessExpression<GroqObjectFromSchema<TObjectSchamasUnion>> {
    __referenceAccess: true| undefined;
    __returnType: GroqObjectType<GroqObjectFromSchema<TObjectSchamasUnion>>| undefined;
    constructor(private readonly fieldName: string, private readonly schemas: TObjectSchamasUnion[], private readonly objectAccessExpression?: GroqExpression<any>) { }
    resolve<TProjection extends ResolvedReferenceProjection<GroqObjectFromSchema<TObjectSchamasUnion>>>(projection: TProjection): GroqExpression<GroqExpressionType<ReturnType<TProjection>>> {
        const arg = new ProjectionAgr<GroqObjectFromSchema<TObjectSchamasUnion>>(this.schemas.map(s => toGroqObject(s)));
        const projectionResult = projection(arg as any);
        return new ResolvedReferenceExpression<GroqExpressionType<ReturnType<TProjection>>>(this, projectionResult);
    }
    toGroq(d: number) {
        if (this.objectAccessExpression)
            return `${this.objectAccessExpression.toGroq(d+1)}.${this.fieldName}`
        return this.fieldName
    }
}

class ProjectionAgr<TObjectsUnion extends AnyTypedGroqObject<any>> implements ObjectUnionAccessExpression<TObjectsUnion> {
    __objectUnionAccess: true | undefined;
    constructor(private readonly elements: TObjectsUnion[]) { 
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
    __returnType: GroqObjectType<TObjectsUnion> | undefined;
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

class ResolvedReferenceExpression<T> implements GroqExpression<T> {
    __returnType: T | undefined;
    constructor(private readonly queryExpression : GroqExpression<any>, private readonly projectionResult: any) { }
    toGroq(d: number = 0): string {
        return `${this.queryExpression.toGroq(d+1)}->${toGroq(this.projectionResult)}`
    }
}