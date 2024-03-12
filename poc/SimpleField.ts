import { FieldBase } from "./Field";
import { GroqExpression } from "./GroqExpression";

export class SimpleField<T> extends FieldBase<GroqExpression<T>> {
    getExpression(name: string) {
        return new SimpleFieldAccessExpression<T>(name);
    }
}

class SimpleFieldAccessExpression<T> implements GroqExpression<T> {
    __returnType: T| undefined;
    constructor(private readonly fieldName: string) { }
    toGroq() {
        return this.fieldName
    }
}

