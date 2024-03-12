import { GroqExpressionOrObject, ConditionalExpression, GroqExpressionType, GroqExpression } from "./GroqExpression";
import { toArray, toGroq } from "./utils";

type UnionToSum<T> = (T extends any ? (k: T) => void : never) extends ((k: infer I) => void) ? I : never
type IsNever<T, K> = [T] extends [never] ? K : T

type UnionResultType<T extends GroqExpressionOrObject> = 
    UnionToSum<(T extends ConditionalExpression<any> ? { } : GroqExpressionType<T>)> & 
    IsNever<T extends ConditionalExpression<any> ? GroqExpressionType<T> : never, {}>

export function union<TArgs extends GroqExpressionOrObject[]>(...args: TArgs): GroqExpression<UnionResultType<TArgs[number]>> {
    return new UnionExpression(args);
}

class UnionExpression<TArgs extends GroqExpressionOrObject[]> implements GroqExpression<UnionResultType<TArgs[number]>> {
    __returnType: UnionResultType<TArgs[number]> | undefined;

    constructor(private readonly args: TArgs) {
    }

    toGroq(d?: number): string {
        return `{${this.args.map(a => toGroq(a)).join(", ")}}`;

        function toGroq(a: GroqExpressionOrObject): any {
            if (typeof a === 'string') return a;
            if (typeof a === 'number') return a;
            if ((a as any).toGroq) return (a as any).toGroq();
            return toArray(a).map(([k, v]) => `"${k}": ${toGroq(v as any)}`).join(", ");
        }
    }
}