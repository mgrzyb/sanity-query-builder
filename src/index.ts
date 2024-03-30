import { GroqExpression } from "./GroqExpression";
import { ObjectArrayField } from "./ObjectArrayField";
import { ObjectField } from "./ObjectField";
import { ObjectSchema } from "./ObjectSchema";
import { ReferenceField } from "./ReferenceField";
import { SimpleField } from "./SimpleField";

export function fetch<T, TParams extends Record<string, any>>(q : GroqExpression<T, TParams>, params: TParams) : T {
    throw Error("Not implemented");    
}

export const F = {
    string: () => new SimpleField<string>(),
    object: <T extends ObjectSchema<any, any>>(type: T) => new ObjectField<T>(type),
    reference: <T extends ObjectSchema<any, any>[]>(elements: T) => new ReferenceField<T[number]>(elements),
    objectArray: <TElements extends (ObjectSchema<any, any> | (()=>ObjectSchema<any, any>))[], TReferences extends (ObjectSchema<any, any> | (()=>ObjectSchema<any, any>))[] = never[]>(elements: TElements, references?: TReferences) => new ObjectArrayField<TElements[number], TReferences[number]>(elements, references??[]),
    referenceArray: <TReferences extends (ObjectSchema<any, any> | (()=>ObjectSchema<any, any>))[]>(references: TReferences) => F.objectArray<never[], TReferences>([], references)
}


