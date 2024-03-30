import { ExpressionFromField } from "./Field";
import { ObjectSchema } from "./ObjectSchema";
import { UnionToSum } from "./utils";

export type GroqExpressionContext = 'union' | 'array-map' | 'projection';
export interface GroqExpression<TReturnType, TParams extends Record<string, any>> {
    __returnType: TReturnType | undefined;
    __params: TParams | undefined;
    
    isProjection?: boolean;
    toGroq(depth?: number, context?: GroqExpressionContext): string
}

export interface ConditionalExpression<T, TParams extends Record<string, any>> extends GroqExpression<T, TParams> {
    _conditionalAccess: true | undefined;
}

export interface ObjectAccessExpression<TObject extends AnyTypedGroqObject<any>, TParams extends Record<string, any>> extends GroqExpression<GroqObjectType<TObject>, TParams> {
    __objectAccess: true | undefined;
}

type IfIsObject<T, TTrue, TFalse> = T extends object ? TTrue : TFalse
export type IsExpressionType<T extends ObjectSchema<any, any>, TProjection extends (e: any) => any> = 
    GroqExpressionType<ReturnType<TProjection>> & IfIsObject<GroqExpressionType<ReturnType<TProjection>>, { _type: T["type"]; }, GroqExpressionType<ReturnType<TProjection>>>

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];    

type ExtractParams_<T extends GroqExpressionOrObject, D extends Prev[number] = 4> = [D] extends [never] ? never : (T extends GroqExpression<any, infer P> ? P : (T extends string | number | boolean ? {} : (T extends Record<string, any> ? ExtractParams_<T[keyof T], Prev[D]> : {})))
export type ExtractParams<T extends GroqExpressionOrObject> = T extends any ? UnionToSum<ExtractParams_<T>> & {} : never;


export interface ObjectUnionAccessExpression<TObjectsUnion extends AnyTypedGroqObject<any>, TParams extends Record<string, any>> extends GroqExpression<GroqObjectType<TObjectsUnion>, TParams> {
    __objectUnionAccess: true | undefined;
    is<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"], {}> } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]> }) => GroqExpressionOrObject>(type: T, projection: TProjection): ConditionalExpression<IsExpressionType<T, TProjection>, ExtractParams<ReturnType<TProjection>>>
}

export type ResolvedReferenceProjection<TObjectsUnion extends AnyTypedGroqObject<any>> = (e: ObjectUnionAccessExpression<TObjectsUnion, {}> & TObjectsUnion) => any
export type ResolvedReferenceProjectionResultType<TProjection extends ResolvedReferenceProjection<any>> = GroqExpressionType<ReturnType<TProjection>>

export interface Ref {
    _ref: string;
    _type: "reference";
}

export interface ReferenceAccessExpression<TObjectsUnion extends AnyTypedGroqObject<any>> extends GroqExpression<Ref, {}> {
    __referenceAccess: true| undefined;
    _type: GroqExpression<'reference', {}>;
    _ref: GroqExpression<string, {}>;    

    resolve<TProjection extends ResolvedReferenceProjection<TObjectsUnion>>(projection: TProjection): GroqExpression<ResolvedReferenceProjectionResultType<TProjection>, ExtractParams<ReturnType<TProjection>>>;
}

export type ArrayElementProjection<TElementsUnion extends AnyTypedGroqObject<any>> = (e: ObjectUnionAccessExpression<TElementsUnion, {}> & TElementsUnion) => any
export type ArrayElementPredicate<TElementsUnion extends AnyTypedGroqObject<any>> = (e: ObjectUnionAccessExpression<TElementsUnion, {}> & TElementsUnion) => any
export type ArrayElementProjectionResultType<TProjection extends ArrayElementProjection<any>> = GroqExpressionType<ReturnType<TProjection>>

export interface ObjectArrayAccessExpression<TElementsUnion extends AnyTypedGroqObject<any>, TParams extends Record<string, any>> extends GroqExpression<readonly (GroqObjectType<TElementsUnion>)[], TParams> {
    __objectArrayAccess: true | undefined;
    map<TProjection extends ArrayElementProjection<TElementsUnion>>(projection: TProjection): GroqExpression<readonly ArrayElementProjectionResultType<TProjection>[], TParams & ExtractParams<ReturnType<TProjection>>>;
    filter<TPredicate extends ArrayElementPredicate<TElementsUnion>>(predicate: TPredicate): ObjectArrayAccessExpression<TElementsUnion, TParams & ExtractParams<ReturnType<TPredicate>>>;
}

export type AnyGroqObject = Record<string, GroqExpression<any, any>>
export type AnyTypedGroqObject<TType extends string> = { _type: GroqExpression<TType, {}> } & AnyGroqObject;
export interface ReferenceObject<TReferencedObjects extends AnyTypedGroqObject<any>> {
    _type: GroqExpression<"reference", {}>;
    _ref: GroqExpression<string, {}>;
}

export type GroqExpressionOrObject = GroqExpression<any, any> | Record<string, any> | string | number | boolean
export type GroqExpressionType<T extends GroqExpressionOrObject> = T extends GroqExpression<infer T, any> ? T : T extends Record<string, any> ? GroqObjectType<T> : T;
export type GroqObjectType<T extends Record<string, any>> = T extends Record<string, any> ? { [K in keyof T]: GroqExpressionType<T[K]> } : never
