import { GroqExpression, ObjectAccessExpression, ReferenceAccessExpression } from "./GroqExpression";

const __exporessionType = Symbol("type");

export interface Field<T extends GroqExpression<any>> {
    
    [__exporessionType]: T | undefined;

    getExpression(fieldName: string): T;
}

export abstract class FieldBase<TExpression extends GroqExpression<any>> implements Field<TExpression> {
    [__exporessionType]: TExpression | undefined;

    abstract getExpression(fieldName: string, objectAccessExpression?: GroqExpression<any>): TExpression;
}

type ExpandObjectAccessExpressions<TExpression> = TExpression extends ObjectAccessExpression<infer TO> ? TExpression & { [K in keyof TO]: ExpandObjectAccessExpressions<TO[K]> } : TExpression;

export type ExpressionFromField<T extends Field<any>> = T extends Field<infer TExpression> ? ExpandObjectAccessExpressions<TExpression> : never