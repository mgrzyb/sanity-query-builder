import { DocumentSchema } from "./DocumentSchema";
import { FieldSchema } from "./FieldSchema";
import { ObjectSchema } from "./ObjectSchema";
import { ObjectArrayFieldSchema } from "./fields/ObjectArrayFieldSchema";
import { EnumFieldSchema } from "./fields/EnumFieldSchema";
import { ObjectFieldSchema } from "./fields/ObjectFieldSchema";
import { ReferenceFieldSchema } from "./fields/ReferenceFieldSchema";
import { StringFieldSchema } from "./fields/StringFieldSchema";

export const F = {
    string: () => new StringFieldSchema(),
    object: <TObjectType extends string, TFieldsSchema extends Record<string, FieldSchema<any, any>>>(type: TObjectType, fields: TFieldsSchema) => new ObjectFieldSchema<TObjectType, TFieldsSchema>(type, fields),
    enum: <TValues extends Record<string, string>>(values: TValues) => new EnumFieldSchema(values),
    reference: <TDocumentTypes extends DocumentSchema<any>[]>(types: TDocumentTypes) => new ReferenceFieldSchema<TDocumentTypes[number]>(types),
    objectArray: <TElementTypes extends (ObjectSchema<any> | (()=>ObjectSchema<any>))[]>(elementTypes: TElementTypes) => new ObjectArrayFieldSchema<TElementTypes>(elementTypes)
}

export function objectSchema<TObjectType extends string, TObjectSchema extends ObjectSchema<TObjectType>>(s: TObjectSchema): TObjectSchema {
    return s;
}

export function documentSchema<TDocumentType extends string, TDocumentSchema extends DocumentSchema<TDocumentType>>(s: TDocumentSchema): TDocumentSchema {
    return s;
}
