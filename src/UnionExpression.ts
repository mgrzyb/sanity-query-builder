import { GroqExpressionOrObject, ConditionalExpression, GroqExpressionType, GroqExpression, GroqExpressionContext, ExtractParams } from "./GroqExpression";
import { UnionToSum, toArray, toGroq } from "./utils";

type IsNever<T, K> = [T] extends [never] ? K : T

type UnionResultType<T extends GroqExpressionOrObject> = 
    UnionToSum<(T extends ConditionalExpression<any, any> ? { } : GroqExpressionType<T>)> & 
    IsNever<T extends ConditionalExpression<any, any> ? GroqExpressionType<T> : never, {}>

export function union<TArgs extends (GroqExpression<object, any> | Record<string, GroqExpressionOrObject>)[]>(...args: TArgs): GroqExpression<UnionResultType<TArgs[number]>, ExtractParams<TArgs[number]>> {
    return new UnionExpression(args);
}

class UnionExpression<TArgs extends GroqExpressionOrObject[]> implements GroqExpression<UnionResultType<TArgs[number]>, ExtractParams<TArgs[number]>> {
    __returnType: UnionResultType<TArgs[number]> | undefined;
    __params: undefined;

    constructor(private readonly args: TArgs) {
    }

    toGroq(depth?: number, context?: GroqExpressionContext): string {
        return `{_type, ${this.args.map(a => toGroq(a, 'union')).join(", ")}}`;
    }
}