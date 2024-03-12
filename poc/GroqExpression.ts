import { ExpressionFromField } from "./Field";
import { ObjectSchema } from "./ObjectSchema";

export interface GroqExpression<TReturnType> {
    __returnType: TReturnType | undefined;
    toGroq(d?: number): string
}

export interface ConditionalExpression<T> extends GroqExpression<T> {
    _conditionalAccess: true | undefined;
}

export interface ObjectAccessExpression<TObject extends AnyTypedGroqObject<any>> extends GroqExpression<GroqObjectType<TObject>> {
    __objectAccess: true | undefined;
}

export interface ObjectUnionAccessExpression<TObjectsUnion extends AnyTypedGroqObject<any>> extends GroqExpression<GroqObjectType<TObjectsUnion>> {
    __objectUnionAccess: true | undefined;
    is<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"]> } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]> }) => any>(type: T, projection: TProjection): ConditionalExpression<GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"] }>
}

export type ResolvedReferenceProjection<TObjectsUnion extends AnyTypedGroqObject<any>> = (e: ObjectUnionAccessExpression<TObjectsUnion> & TObjectsUnion) => any
export type ResolvedReferenceProjectionResultType<TProjection extends ResolvedReferenceProjection<any>> = GroqExpressionType<ReturnType<TProjection>>

export interface ReferenceAccessExpression<TObjectsUnion extends AnyTypedGroqObject<any>> extends GroqExpression<GroqObjectType<TObjectsUnion>> {
    __referenceAccess: true| undefined;
    resolve<TProjection extends ResolvedReferenceProjection<TObjectsUnion>>(projection: TProjection): GroqExpression<ResolvedReferenceProjectionResultType<TProjection>>;
}

export type ArrayElementProjection<TElementsUnion extends AnyTypedGroqObject<any>> = (e: ObjectUnionAccessExpression<TElementsUnion> & TElementsUnion) => any
export type ArrayElementProjectionResultType<TProjection extends ArrayElementProjection<any>> = GroqExpressionType<ReturnType<TProjection>>

export interface ObjectArrayAccessExpression<TElementsUnion extends AnyTypedGroqObject<any>> extends GroqExpression<readonly (GroqObjectType<TElementsUnion>)[]> {
    __objectArrayAccess: true | undefined;
    map<TProjection extends ArrayElementProjection<TElementsUnion>>(projection: TProjection): GroqExpression<readonly ArrayElementProjectionResultType<TProjection>[]>;
}

export type AnyGroqObject = Record<string, GroqExpression<any>>
export type AnyTypedGroqObject<TType extends string> = { _type: GroqExpression<TType> } & AnyGroqObject;

export type GroqExpressionOrObject = GroqExpression<any> | Record<string, any> | string | number
export type GroqExpressionType<T extends GroqExpressionOrObject> = T extends GroqExpression<infer T> ? T : T extends Record<string, any> ? GroqObjectType<T> : T;
export type GroqObjectType<T extends Record<string, any>> = { [K in keyof T]: GroqExpressionType<T[K]> }
