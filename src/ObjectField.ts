import { FieldAccessExpression, FieldBase } from "./Field";
import { ObjectAccessExpression, AnyTypedGroqObject, GroqObjectType, GroqExpressionContext } from "./GroqExpression";
import { GroqObjectFromObjectSchema, ObjectSchema } from "./ObjectSchema";
import { SimpleFieldAccessExpression } from "./SimpleField";
import { toArray } from "./utils";

export class ObjectField<TSchema extends ObjectSchema<any, any>> extends FieldBase<ObjectAccessExpression<GroqObjectFromObjectSchema<TSchema>, {}>> {
    constructor(private readonly schema: TSchema) { super() }
    getExpression(name: string, objectAccessExpression?: ObjectAccessExpression<any, any>) : ObjectAccessExpression<GroqObjectFromObjectSchema<TSchema>, {}>{
        return new ObjectFieldAccessExpression<GroqObjectFromObjectSchema<TSchema>>(name, this.schema, objectAccessExpression);
    }
}

class ObjectFieldAccessExpression<TObject extends AnyTypedGroqObject<any>> extends FieldAccessExpression implements ObjectAccessExpression<TObject, {}> {
    __objectAccess: true| undefined;
    __returnType: GroqObjectType<TObject>| undefined;
    __params: {} | undefined;
    constructor(fieldName: string, private readonly schema: ObjectSchema<any, any>, objectAccessExpression?: ObjectAccessExpression<any, any>) {
        
        super(fieldName, objectAccessExpression);

        for (const [k, v] of toArray(schema.fields)) {
            (this as any)[k] = v.getExpression(k, this)
        }
        (this as any)._type = new SimpleFieldAccessExpression<TObject["_type"]>("_type", this)
     }  
}

