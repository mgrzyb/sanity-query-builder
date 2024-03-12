import { FieldBase } from "./Field";
import { ObjectAccessExpression, AnyTypedGroqObject, GroqObjectType } from "./GroqExpression";
import { ObjectSchema, GroqObjectFromSchema } from "./ObjectSchema";
import { toArray } from "./utils";

export class ObjectField<TSchema extends ObjectSchema<any, any>> extends FieldBase<ObjectAccessExpression<GroqObjectFromSchema<TSchema>>> {
    constructor(private readonly schema: TSchema) { super() }
    getExpression(name: string) {
        return new ObjectFieldAccessExpression<GroqObjectFromSchema<TSchema>>(name, this.schema);
    }
}

class ObjectFieldAccessExpression<TObject extends AnyTypedGroqObject<any>> implements ObjectAccessExpression<TObject> {
    __objectAccess: true| undefined;
    __returnType: GroqObjectType<TObject>| undefined;
    constructor(private readonly fieldName: string, private readonly schema: ObjectSchema<any, any>) {
        for (const [k, v] of toArray(schema.fields)) {
            (this as any)[k] = v.getExpression(k)
        }
     }
    toGroq(d: number) {
        if (d > 0) {
            return this.fieldName + '.'
    }
}

