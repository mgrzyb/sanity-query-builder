import { ExpressionFromField, FieldAccessExpression, FieldBase } from "./Field";
import { ReferenceAccessExpression, ResolvedReferenceProjection, GroqExpression, GroqExpressionType, GroqObjectType, AnyTypedGroqObject, ObjectUnionAccessExpression, GroqExpressionOrObject, ConditionalExpression, Ref, GroqExpressionContext, ExtractParams, ObjectAccessExpression } from "./GroqExpression";
import { ObjectSchema, GroqObjectFromObjectSchema } from "./ObjectSchema";
import { SimpleFieldAccessExpression } from "./SimpleField";
import { toArray, toGroq, toGroqObject } from "./utils";

export class ReferenceField<TObjectsSchemaUnion extends ObjectSchema<any, any>> extends FieldBase<ReferenceFieldAccessExpression<TObjectsSchemaUnion>> {
    constructor(private readonly schemas: TObjectsSchemaUnion[]) { super() }
    getExpression(name: string, objectAccessExpression?: GroqExpression<any, any>) {
        return new ReferenceFieldAccessExpression<TObjectsSchemaUnion>(name, this.schemas, objectAccessExpression);
    }
}

class ReferenceFieldAccessExpression<TObjectSchamasUnion extends ObjectSchema<any, any>> extends FieldAccessExpression implements ReferenceAccessExpression<GroqObjectFromObjectSchema<TObjectSchamasUnion>> {
    __referenceAccess: true| undefined;
    __returnType: Ref | undefined;
    __params: undefined;

    readonly _type;
    readonly _ref;

    constructor(fieldName: string, private readonly schemas: TObjectSchamasUnion[], objectAccessExpression?: GroqExpression<any, any>) {
        super(fieldName, objectAccessExpression);

        this._type = new SimpleFieldAccessExpression<'reference'>('_type', this);;
        this._ref = new SimpleFieldAccessExpression<string>('_ref', this);
        }

    isProjection?: boolean | undefined;
    resolve<TProjection extends ResolvedReferenceProjection<GroqObjectFromObjectSchema<TObjectSchamasUnion>>>(projection: TProjection): GroqExpression<GroqExpressionType<ReturnType<TProjection>>, ExtractParams<ReturnType<TProjection>>> {
        const arg = new ProjectionAgr<GroqObjectFromObjectSchema<TObjectSchamasUnion>>(this.schemas.map(s => toGroqObject(s)));
        const projectionResult = projection(arg as any);
        return new ResolvedReferenceExpression<GroqExpressionType<ReturnType<TProjection>>, ExtractParams<ReturnType<TProjection>>>(this, projectionResult);
    }
}

class ProjectionAgr<TObjectsUnion extends AnyTypedGroqObject<any>> implements ObjectUnionAccessExpression<TObjectsUnion, {}> {
    __objectUnionAccess: true | undefined;
    __returnType: GroqObjectType<TObjectsUnion> | undefined;
    __params: undefined;
    constructor(private readonly elements: TObjectsUnion[]) { 
        // TODO: extract common fields from elements
        (this as any)["_type"] = new SimpleFieldAccessExpression<string>('_type');
        for (const e of elements) {
            for (const [k, v] of toArray(e)) {
                (this as any)[k] = v
            }
        }
    }

    is<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"], {}>; } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]>; }) => any>(type: T, projection: TProjection): ConditionalExpression<GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"]; }, ExtractParams<ReturnType<TProjection>>> {
        const projectionResult = projection({ _type: type.type, ...this as any });
        return new IsTypeExpression(this, type, projectionResult)
    }
    toGroq(depth?: number, context?: GroqExpressionContext): string {
        return "{...}"
    }
    
}

class IsTypeExpression<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"], {}>; } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]>; }) => GroqExpressionOrObject> implements ConditionalExpression<GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"]; }, ExtractParams<ReturnType<TProjection>>> {
    _conditionalAccess: true | undefined;
    __returnType: (GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"]; }) | undefined;
    __params: undefined;
    constructor(private readonly elements: ObjectUnionAccessExpression<any, any>, private readonly type: T, private readonly projectionResult: GroqExpressionOrObject) { }
    toGroq(depth?: number, context?: GroqExpressionContext): string {
        return `_type == '${this.type.type}' => ${toGroq(this.projectionResult)}`
    }
}

class ResolvedReferenceExpression<T, TParams extends Record<string, any>> implements GroqExpression<T, TParams> {
    __returnType: T | undefined;
    __params: undefined;
    constructor(private readonly queryExpression : GroqExpression<any, any>, private readonly projectionResult: any) { }
    toGroq(depth: number = 0, context?: GroqExpressionContext): string {
        return `${this.queryExpression.toGroq(depth + 1)}->${toGroq(this.projectionResult)}`
    }
}