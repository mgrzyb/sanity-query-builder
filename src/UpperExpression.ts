import { GroqExpression, GroqExpressionContext } from './GroqExpression';

export function upper(s: GroqExpression<string>) {
    return new UpperExpression(s);
}

class UpperExpression implements GroqExpression<string> {
    __returnType: string | undefined;
    constructor(private readonly s: GroqExpression<string>) { }
    toGroq(depth: number = 0, context?: GroqExpressionContext) {
        return `upper(${this.s.toGroq(depth + 1)})`
    }
}