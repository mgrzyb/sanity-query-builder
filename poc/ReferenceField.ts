import { FieldBase } from "./Field";
import { ReferenceAccessExpression, ResolvedReferenceProjection, GroqExpression, GroqExpressionType, GroqObjectType } from "./GroqExpression";
import { ObjectSchema, GroqObjectFromSchema } from "./ObjectSchema";

export class ReferenceField<TObjectsSchemaUnion extends ObjectSchema<any, any>> extends FieldBase<ReferenceAccessExpression<GroqObjectFromSchema<TObjectsSchemaUnion>>> {
    constructor(private readonly schemas: TObjectsSchemaUnion[]) { super() }
    getExpression(name: string) {
        return new ReferenceFieldAccessExpression<TObjectsSchemaUnion>(name);
    }
}

class ReferenceFieldAccessExpression<TObjectSchamasUnion extends ObjectSchema<any, any>> implements ReferenceAccessExpression<GroqObjectFromSchema<TObjectSchamasUnion>> {
    __referenceAccess: true| undefined;
    __returnType: GroqObjectType<GroqObjectFromSchema<TObjectSchamasUnion>>| undefined;
    constructor(private readonly fieldName: string) { }
    resolve<TProjection extends ResolvedReferenceProjection<GroqObjectFromSchema<TObjectSchamasUnion>>>(projection: TProjection): GroqExpression<GroqExpressionType<ReturnType<TProjection>>> {
        throw new Error("Method not implemented.");
    }
    toGroq(): string {
        throw new Error("Method not implemented.");
    }
}
