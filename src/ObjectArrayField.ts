import { ExpressionFromField, FieldAccessExpression, FieldBase } from "./Field";
import { ObjectArrayAccessExpression, GroqExpression, ArrayElementProjection, ArrayElementProjectionResultType, GroqObjectType, ObjectAccessExpression, ObjectUnionAccessExpression, ConditionalExpression, GroqExpressionType, GroqExpressionOrObject, GroqExpressionContext, IsExpressionType, ArrayElementPredicate, ExtractParams } from "./GroqExpression";
import { GroqObjectFromObjectSchema, ObjectSchema } from "./ObjectSchema";
import { SimpleFieldAccessExpression } from "./SimpleField";
import { isGroqExpression, toArray, toGroq, toGroqObject } from "./utils";

type Foo<T extends (ObjectSchema<any, any> | (()=>ObjectSchema<any, any>))> = T extends (()=>infer R) ? (R extends ObjectSchema<any, any> ? R : never) : (T extends ObjectSchema<any, any> ? T : never)

export class ObjectArrayField<TElementSchemasUnion extends (ObjectSchema<any, any> | (() => ObjectSchema<any, any>)), TReferenceSchemasUnion extends (ObjectSchema<any, any> | (() => ObjectSchema<any, any>))> extends 
    FieldBase<ObjectArrayAccessExpression<Bar<Foo<TElementSchemasUnion>, Foo<TReferenceSchemasUnion>>, {}>> {

    constructor(private readonly elementSchemas: TElementSchemasUnion[], private readonly referenceSchemas: TReferenceSchemasUnion[]) { super() }

    getExpression(name: string, objectAccessExpression?: ObjectAccessExpression<any, any>) {
        return new ObjectArrayFieldAccessExpression<Foo<TElementSchemasUnion>, Foo<TReferenceSchemasUnion>>(name, this.elementSchemas.map(e => e instanceof Function ? e() : e) as any, this.referenceSchemas.map(e => e instanceof Function ? e() : e) as any, objectAccessExpression);
    }
}

type Bar<TElementSchemas extends ObjectSchema<any, any>, TReferenceSchemas extends ObjectSchema<any, any>> = GroqObjectFromObjectSchema<TElementSchemas> | (TReferenceSchemas extends ObjectSchema<any, any> ? {_type: GroqExpression<'reference', {}>, "_ref": GroqExpression<string, {}> } : never)

class ObjectArrayFieldAccessExpression<TElementSchemas extends ObjectSchema<any, any>, TReferenceSchemas extends ObjectSchema<any, any>> extends FieldAccessExpression implements ObjectArrayAccessExpression<Bar<TElementSchemas, TReferenceSchemas>, {}> {
    __objectArrayAccess: true| undefined;
    __returnType: readonly GroqObjectType<Bar<TElementSchemas, TReferenceSchemas>>[] | undefined;
    __params: undefined;
    isProjection?: boolean | undefined;

    constructor(fieldName : string, private readonly elementSchemas:TElementSchemas[], private readonly referenceSchemas: TReferenceSchemas[], objectAccessExpression?: GroqExpression<any, any>) { 
        super(fieldName, objectAccessExpression);
    }
    
    map<TProjection extends ArrayElementProjection<Bar<TElementSchemas, TReferenceSchemas>>>(projection: TProjection): GroqExpression<readonly ArrayElementProjectionResultType<TProjection>[], ExtractParams<ReturnType<TProjection>>> {
        const arg = new ProjectionAgr<TElementSchemas | TReferenceSchemas>(this.elementSchemas, this.referenceSchemas);
        const projectionResult = projection(arg as any);
        return new MappedArrayExpression<ArrayElementProjectionResultType<TProjection>, ExtractParams<ReturnType<TProjection>>>(this, projectionResult);
    }

    filter<TPredicate extends ArrayElementPredicate<Bar<TElementSchemas, TReferenceSchemas>>>(predicate: TPredicate): ObjectArrayAccessExpression<Bar<TElementSchemas, TReferenceSchemas>, ExtractParams<ReturnType<TPredicate>>> {
        throw new Error("Method not implemented.");
    }    
}

class ProjectionAgr<TElementSchemas extends ObjectSchema<any, any>> implements ObjectUnionAccessExpression<GroqObjectFromObjectSchema<TElementSchemas>, {}> {
    __objectUnionAccess: true | undefined;
    __returnType: GroqObjectType<GroqObjectFromObjectSchema<TElementSchemas>> | undefined;
    __params: undefined;

    constructor(private readonly elementSchemas: TElementSchemas[], private readonly referenceSchemas: TElementSchemas[]) { 
        // TODO: extract common fields from elements
        for (const e of elementSchemas.map(s => toGroqObject(s))) {
            for (const [k, v] of toArray(e)) {
                (this as any)[k] = v
            }
        }

        if (referenceSchemas?.length) {
            (this as any)['_ref'] = new SimpleFieldAccessExpression<string>('_ref');
            for (const e of referenceSchemas.map(s => toGroqObject(s))) {
                for (const [k, v] of toArray(e)) {
                    (this as any)[k] = v
                }
            }
    
        }
    }

    is<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"], {}>; } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]>; }) => any>(type: T, projection: TProjection): ConditionalExpression<IsExpressionType<T, TProjection>, ExtractParams<ReturnType<TProjection>>> {
        const projectionResult = projection({ _type: type.type, ...this as any });
        if (this.elementSchemas.find(e => e.type === type.type))
            return new IsObjectTypeExpression(this, type, projectionResult)
        if (this.referenceSchemas.find(e => e.type === type.type))
            return new IsReferenceTypeExpression(this, type, projectionResult)
        throw new Error(`Type ${type.type} not found among element schemas or reference schemas in ObjectArrayFieldAccessExpression.is`)
    }

    toGroq(depth?: number, context?: GroqExpressionContext): string {
        return "{...}"
    }
}

class IsObjectTypeExpression<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"], {}>; } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]>; }) => any> implements ConditionalExpression<IsExpressionType<T, TProjection>, ExtractParams<ReturnType<TProjection>>> {
    _conditionalAccess: true | undefined;
    __returnType: (GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"]; }) | undefined;
    __params: undefined;
    constructor(private readonly elements: ObjectUnionAccessExpression<any, any>, private readonly type: T, private readonly projectionResult: GroqExpressionOrObject) { }
    toGroq(depth?: number, context?: GroqExpressionContext): string {
        return `_type == "${this.type.type}" => ${toGroq(this.projectionResult, 'array-map')}`
    }
}

class IsReferenceTypeExpression<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"], {}>; } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]>; }) => any> implements ConditionalExpression<IsExpressionType<T, TProjection>, ExtractParams<ReturnType<TProjection>>> {
    _conditionalAccess: true | undefined;
    __returnType: (GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"]; }) | undefined;
    __params: undefined;
    constructor(private readonly elements: ObjectUnionAccessExpression<any, any>, private readonly type: T, private readonly projectionResult: GroqExpressionOrObject) { }
    toGroq(depth?: number, context?: GroqExpressionContext): string {
        if ((context === undefined || context==="array-map") && isGroqExpression(this.projectionResult) && !this.projectionResult.isProjection)
            return `{"foo": select((_type == "reference" && @->_type == "${this.type.type}") => @->${toGroq(this.projectionResult)})}[].foo`
        if (context === 'array-map')
            return `{(_type == "reference" && @->_type == "${this.type.type}") => @->${toGroq(this.projectionResult)}}`
        if (context === 'union')
            return `(_type == "reference" && @->_type == "${this.type.type}") => @->${toGroq(this.projectionResult)}`
        return `select((_type == "reference" && @->_type == "${this.type.type}") => @->${toGroq(this.projectionResult)})`
        
    }
}
class MappedArrayExpression<T, TParams extends Record<string, any>> implements GroqExpression<readonly T[], TParams> {
    __returnType: readonly T[] | undefined;
    __params: undefined;
    constructor(private readonly fieldAccessExpression : GroqExpression<any, any>, private readonly projectionResult: any) { }
    toGroq(depth?: number, context?: GroqExpressionContext): string {
        return `${this.fieldAccessExpression.toGroq()}[] ${toGroq(this.projectionResult, 'array-map')}`
    }
}