import { GroqExpression } from "./GroqExpression";
import { ObjectArrayField } from "./ObjectArrayField";
import { ObjectField } from "./ObjectField";
import { ObjectSchema } from "./ObjectSchema";
import { ReferenceField } from "./ReferenceField";
import { SimpleField } from "./SimpleField";

export function fetch<T>(q : GroqExpression<T>) : T {
    throw Error("Not implemented");    
}

export const F = {
    string: () => new SimpleField<string>(),
    object: <T extends ObjectSchema<any, any>>(type: T) => new ObjectField<T>(type),
    reference: <T extends ObjectSchema<any, any>[]>(elements: T) => new ReferenceField<T[number]>(elements),
    objectArray: <T extends ObjectSchema<any, any>[]>(elements: T) => new ObjectArrayField<T[number]>(elements)
}


