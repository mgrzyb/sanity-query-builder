import { Field, FieldBase } from "./Field";
import { ObjectArrayAccessExpression, AnyTypedGroqObject, GroqExpression, ArrayElementProjection, ArrayElementProjectionResultType, GroqObjectType, ObjectAccessExpression } from "./GroqExpression";
import { ObjectSchema, GroqObjectFromSchema } from "./ObjectSchema";
import { toArray, toGroqObject } from "./utils";

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
        return new MappedArrayExpression<ArrayElementProjectionResultType<TProjection>>(this, projection);
    }
    toGroq(d: number) {
        if (this.objectAccessExpression)
            return `${this.objectAccessExpression.toGroq(d+1)}.${this.fieldName}`
        return this.fieldName
    }
}

class MappedArrayExpression<T> implements GroqExpression<readonly T[]> {
    __returnType: readonly T[] | undefined;
    constructor(private readonly fieldAccessExpression : GroqExpression<any>, private readonly projection: any) { }
    toGroq(d: number = 0): string {
        return `${this.fieldAccessExpression.toGroq(d+1)}[] {${toArray(this.projection).map(([k, v]) => `${k}: ${v.toGroq(d+1)}`).join(', ')}}`
    }
}