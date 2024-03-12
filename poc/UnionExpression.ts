import { GroqExpressionOrObject, ConditionalExpression, GroqExpressionType, GroqExpression } from "./GroqExpression";

type UnionToSum<T> = (T extends any ? (k: T) => void : never) extends ((k: infer I) => void) ? I : never
type IsNever<T, K> = [T] extends [never] ? K : T

type UnionResultType<T extends GroqExpressionOrObject> = 
    UnionToSum<(T extends ConditionalExpression<any> ? { } : GroqExpressionType<T>)> & 
    IsNever<T extends ConditionalExpression<any> ? GroqExpressionType<T> : never, {}>

export function union<TArgs extends GroqExpressionOrObject[]>(...args: TArgs): GroqExpression<UnionResultType<TArgs[number]>> {
    throw Error("Not implemented");
}