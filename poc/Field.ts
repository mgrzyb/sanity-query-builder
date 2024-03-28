import { GroqExpression, GroqExpressionContext, ObjectAccessExpression } from "./GroqExpression";

const __exporessionType = Symbol("type");

export interface Field<T extends GroqExpression<any>> {
    
    [__exporessionType]: T | undefined;

    getExpression(fieldName: string): T;
}

export abstract class FieldBase<TExpression extends GroqExpression<any>> implements Field<TExpression> {
    [__exporessionType]: TExpression | undefined;

    abstract getExpression(fieldName: string, objectAccessExpression?: GroqExpression<any>): TExpression;
}

export abstract class FieldAccessExpression {
    constructor(private readonly fieldName: string, private readonly objectAccessExpression?: GroqExpression<any>) { }

    toGroq(depth: number = 0, context?: GroqExpressionContext) {
        if (this.objectAccessExpression)
            return `${this.objectAccessExpression.toGroq(depth + 1)}.${this.fieldName}`
        if (context == 'array-map')
            return `.${this.fieldName}`;
        return this.fieldName;
    }
}

export type ExpandObjectAccessExpressions<TExpression> = TExpression extends ObjectAccessExpression<infer TO> ? TExpression & { [K in keyof TO]: ExpandObjectAccessExpressions<TO[K]> } : TExpression;

export type ExpressionFromField<T extends Field<any>> = T extends Field<infer TExpression> ? ExpandObjectAccessExpressions<TExpression> : never