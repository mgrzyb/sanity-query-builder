import { GroqExpression } from "./GroqExpression"
import { toGroq } from "./utils"

export function eq<T extends string | number>(a: GroqExpression<T> | T, b: GroqExpression<T> | T): GroqExpression<boolean> {
    return {
        __returnType: true,
        toGroq: () => `${toGroq(a)} == ${toGroq(b)}`
    }
}

export function neq<T extends string | number>(a: GroqExpression<T> | T, b: GroqExpression<T> | T): GroqExpression<boolean> {
    return {
        __returnType: true,
        toGroq: () => `${toGroq(a)} != ${toGroq(b)}`
    }
}

export function and(a: GroqExpression<boolean>, b: GroqExpression<boolean>): GroqExpression<boolean> {
    return {
        __returnType: true,
        toGroq: () => `(${toGroq(a)} && ${toGroq(b)})`
    }
}

export function or(a: GroqExpression<boolean>, b: GroqExpression<boolean>): GroqExpression<boolean> {
    return {
        __returnType: true,
        toGroq: () => `(${toGroq(a)} || ${toGroq(b)})`
    }
}

export function select<T extends object | number | string | boolean>(condition: GroqExpression<boolean>, v: GroqExpression<T> | T): GroqExpression<T | null>;
export function select<T extends object | number | string | boolean, K extends object | number | string | boolean>(condition: GroqExpression<boolean>, v: GroqExpression<T> | T, elseV: GroqExpression<K> | K): GroqExpression<T | K>;
export function select<T extends object | number | string | boolean, K extends object | number | string | boolean>(condition: GroqExpression<boolean>, v: GroqExpression<T> | T, elseV?: GroqExpression<K> | K) {
        return {
        __returnType: undefined,
        toGroq: () => elseV === undefined ? `select(${toGroq(condition)} => ${toGroq(v)})` : `select(${toGroq(condition)} => ${toGroq(v)}, ${toGroq(elseV)})`
    }
}