import { ExpressionFromField, Field } from "./Field";
import { GroqExpression } from "./GroqExpression";

export interface ObjectSchema<TType extends string, TFields extends Record<string, Field<any>>> {
    type: TType;
    fields: TFields;
}

export type GroqObjectFromObjectSchema<TSource extends ObjectSchema<any, any>> = 
TSource extends ObjectSchema<any, any> ? {
    [K in keyof TSource["fields"]]: ExpressionFromField<TSource["fields"][K]>;
} & {
    _type: GroqExpression<TSource["type"]>;
} : never;

