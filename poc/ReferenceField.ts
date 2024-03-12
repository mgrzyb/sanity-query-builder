import { FieldBase } from "./Field";
import { ReferenceAccessExpression, ResolvedReferenceProjection, GroqExpression, GroqExpressionType, GroqObjectType } from "./GroqExpression";
import { ObjectSchema, GroqObjectFromSchema } from "./ObjectSchema";

export class ReferenceField<TObjectsSchemaUnion extends ObjectSchema<any, any>> extends FieldBase<ReferenceAccessExpression<GroqObjectFromSchema<TObjectsSchemaUnion>>> {
    constructor(private readonly schemas: TObjectsSchemaUnion[]) { super() }
    getExpression(name: string, objectAccessExpression?: GroqExpression<any>) {
        return new ReferenceFieldAccessExpression<TObjectsSchemaUnion>(name, objectAccessExpression);
    }
}

class ReferenceFieldAccessExpression<TObjectSchamasUnion extends ObjectSchema<any, any>> implements ReferenceAccessExpression<GroqObjectFromSchema<TObjectSchamasUnion>> {
    __referenceAccess: true| undefined;
    __returnType: GroqObjectType<GroqObjectFromSchema<TObjectSchamasUnion>>| undefined;
    constructor(private readonly fieldName: string, private readonly objectAccessExpression?: GroqExpression<any>) { }
    resolve<TProjection extends ResolvedReferenceProjection<GroqObjectFromSchema<TObjectSchamasUnion>>>(projection: TProjection): GroqExpression<GroqExpressionType<ReturnType<TProjection>>> {
        new ObjectUnionAccessExpression
        const projectionResult = projection(this.fieldName);
        return new ResolvedReferenceExpression<GroqExpressionType<ReturnType<TProjection>>>(this, projection);
    }
    toGroq(d: number) {
        if (this.objectAccessExpression)
            return `${this.objectAccessExpression.toGroq(d+1)}.${this.fieldName}`
        return this.fieldName
    }
}

class ResolvedReferenceExpression<T> implements GroqExpression<T> {
    __returnType: T | undefined;
    constructor(private readonly queryExpression : GroqExpression<any>, private readonly projection: any) { }
    toGroq(d: number = 0): string {
        return `${this.queryExpression.toGroq(d+1)}{${toArray(this.projection).map(([k, v]) => `${k}: ${v.toGroq(d+1)}`).join(', ')}}`
    }
}