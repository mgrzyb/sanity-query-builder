import { FieldBase } from "./Field";
import { GroqExpression } from "./GroqExpression";

export class SimpleField<T> extends FieldBase<GroqExpression<T>> {
    getExpression(name: string, objectAccessExpression?: GroqExpression<any>) {
        return new SimpleFieldAccessExpression<T>(name, objectAccessExpression);
    }
}

class SimpleFieldAccessExpression<T> implements GroqExpression<T> {
    __returnType: T| undefined;
    constructor(private readonly fieldName: string, private readonly objectAccessExpression?: GroqExpression<any>) { }
    toGroq(d: number) {
        if (this.objectAccessExpression)
            return `${this.objectAccessExpression.toGroq(d+1)}.${this.fieldName}`
        return this.fieldName
    }
}

