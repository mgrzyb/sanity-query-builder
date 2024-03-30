import { ExtractParams, GroqExpression, GroqExpressionType } from "./GroqExpression"
import { toGroq } from "./utils"

export function eq<T extends string | number, TA extends GroqExpression<T, any> | T, TB extends GroqExpression<T, any> | T>(a: TA, b: TB): GroqExpression<boolean, ExtractParams<TA> & ExtractParams<TB>> {
    return {
        __returnType: true,
        __params: undefined,
        toGroq: () => `${toGroq(a)} == ${toGroq(b)}`
    }
}

export function neq<T extends string | number, TA extends GroqExpression<T, any> | T, TB extends GroqExpression<T, any> | T>(a: TA, b: TB): GroqExpression<boolean, ExtractParams<TA> & ExtractParams<TB>> {
    return {
        __returnType: true,
        __params: undefined,
        toGroq: () => `${toGroq(a)} != ${toGroq(b)}`
    }
}

export function and<TA extends GroqExpression<boolean, any> | boolean, TB extends GroqExpression<boolean, any> | boolean>(a: TA, b: TB): GroqExpression<boolean, ExtractParams<TA> & ExtractParams<TB>> {
    return {
        __returnType: true,
        __params: undefined,
        toGroq: () => `(${toGroq(a)} && ${toGroq(b)})`
    }
}

export function or<TA extends GroqExpression<boolean, any> | boolean, TB extends GroqExpression<boolean, any> | boolean>(a: TA, b: TB): GroqExpression<boolean, ExtractParams<TA> & ExtractParams<TB>> {
    return {
        __returnType: true,
        __params: undefined,
        toGroq: () => `(${toGroq(a)} || ${toGroq(b)})`
    }
}

export function select<T extends object | number | string | boolean, TCondition extends GroqExpression<boolean, any>, TValue extends GroqExpression<T, any> | T>(condition: TCondition, v: TValue): GroqExpression<GroqExpressionType<TValue> | null, {}>;
export function select<T extends object | number | string | boolean, K extends object | number | string | boolean, TCondition extends GroqExpression<boolean, any>, TValue extends GroqExpression<T, any> | T, TElseValue extends GroqExpression<K, any> | K>(condition: TCondition, v: TValue, elseV: TElseValue): GroqExpression<GroqExpressionType<TValue> | GroqExpressionType<TElseValue>, {}>;
export function select<T extends object | number | string | boolean, K extends object | number | string | boolean, TCondition extends GroqExpression<boolean, any>, TValue extends GroqExpression<T, any> | T, TElseValue extends GroqExpression<K, any> | K>(condition: TCondition, v: TValue, elseV?: TElseValue) {
        return {
        __returnType: undefined,
        __params: undefined,
        toGroq: () => elseV === undefined ? `select(${toGroq(condition)} => ${toGroq(v)})` : `select(${toGroq(condition)} => ${toGroq(v)}, ${toGroq(elseV)})`
    }
}

export const P = {
    string: <TName extends string>(name: TName)=>param<TName, string>(name),
    number: <TName extends string>(name: TName)=>param<TName, number>(name),
}

function param<TName extends string, T extends string | number>(name: TName) : GroqExpression<T, { [K in TName]: string }> {
    return { __returnType: undefined, __params: undefined, toGroq: () => `$${name}` }
}