import { GroqExpression, GroqExpressionContext } from './GroqExpression';

export function upper<TParams extends Record<string, any>>(s: GroqExpression<string, TParams>) {
    return new UpperExpression<TParams>(s);
}

class UpperExpression<TParams extends Record<string, any>> implements GroqExpression<string, TParams> {
    __returnType: string | undefined;
    __params: undefined;
    constructor(private readonly s: GroqExpression<string, any>) { }
    toGroq(depth: number = 0, context?: GroqExpressionContext) {
        return `upper(${this.s.toGroq(depth + 1)})`
    }
}