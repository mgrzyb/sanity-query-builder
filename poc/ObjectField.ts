import { FieldBase } from "./Field";
import { ObjectAccessExpression, AnyTypedGroqObject, GroqObjectType } from "./GroqExpression";
import { ObjectSchema, GroqObjectFromSchema } from "./ObjectSchema";
import { toArray } from "./utils";

export class ObjectField<TSchema extends ObjectSchema<any, any>> extends FieldBase<ObjectAccessExpression<GroqObjectFromSchema<TSchema>>> {
    constructor(private readonly schema: TSchema) { super() }
    getExpression(name: string, objectAccessExpression?: ObjectAccessExpression<any>) {
        return new ObjectFieldAccessExpression<GroqObjectFromSchema<TSchema>>(name, this.schema, objectAccessExpression);
    }
}

class ObjectFieldAccessExpression<TObject extends AnyTypedGroqObject<any>> implements ObjectAccessExpression<TObject> {
    __objectAccess: true| undefined;
    __returnType: GroqObjectType<TObject>| undefined;
    constructor(private readonly fieldName: string, private readonly schema: ObjectSchema<any, any>, private readonly objectAccessExpression?: ObjectAccessExpression<any>) {
        for (const [k, v] of toArray(schema.fields)) {
            (this as any)[k] = v.getExpression(k, this)
        }
     }
    toGroq(d: number) {
        if (this.objectAccessExpression)
            return `${this.objectAccessExpression.toGroq(d+1)}.${this.fieldName}`
        return this.fieldName
    }
}

