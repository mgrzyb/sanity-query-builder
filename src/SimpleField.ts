import { FieldAccessExpression, FieldBase } from "./Field";
import { GroqExpression, GroqExpressionContext } from "./GroqExpression";

export class SimpleField<T> extends FieldBase<GroqExpression<T>> {
    getExpression(name: string, objectAccessExpression?: GroqExpression<any>): GroqExpression<T> {
        return new SimpleFieldAccessExpression<T>(name, objectAccessExpression);
    }
}

export class SimpleFieldAccessExpression<T> extends FieldAccessExpression implements GroqExpression<T> {
    __returnType: T | undefined;
    constructor(fieldName: string, objectAccessExpression?: GroqExpression<any>) {
        super(fieldName, objectAccessExpression);
    }
}

