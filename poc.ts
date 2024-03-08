interface Field<T extends GroqExpression<any>> {
}

interface ObjectSchema<TType extends string, TFields extends Record<string, Field<any>> {
    type: TType
    fields: TFields
}

interface GroqExpression<TReturnType> {
    toGroq(): string
}

type ExpressionFromField<T extends Field<any>> = T extends Field<infer TExpression> ? TExpression : never
type AnyGroqObject = Record<string, GroqExpression<any>>
type AnyTypedGroqObject<TType extends string> = { _type: TType } & AnyGroqObject;

type GroqExpressionOrValue = GroqExpression<any> | AnyGroqObject

type GroqObjectType<T extends AnyGroqObject> = { [K in keyof T]: GroqExpressionType<T[K]> }
type GroqObjectUnionType<T extends AnyGroqObject> = T extends AnyGroqObject ? GroqObjectType<T> : never;

type GroqExpressionType<T extends GroqExpressionOrValue> = T extends GroqExpression<infer T> ? T : T extends AnyGroqObject ? GroqObjectType<T> : never;

class FieldAccessExpression<T> implements GroqExpression<T> {
    constructor(private readonly fieldName: string) { }
    toGroq() {
        return this.fieldName
    }
}

interface ObjectExpression<TObjects extends AnyTypedGroqObject<any>> extends GroqExpression<GroqObjectUnionType<TObjects>> {
    is<T extends TObjects>(type: T, projection: (e: T) => any): GroqExpression<any>
} 


type ArrayElementProjection<TElementsUnion extends AnyTypedGroqObject<any>> = (e: ObjectExpression<TElementsUnion> & TElementsUnion) => any

type ArrayElementProjectionResultType<TProjection extends ArrayElementProjection<any>> = 
    GroqExpressionType<ReturnType<TProjection>>

interface ObjectArrayExpression<TElementsUnion extends AnyTypedGroqObject<any>> extends GroqExpression<readonly (GroqObjectUnionType<TElementsUnion>)[]> {
    map<TProjection extends ArrayElementProjection<TElementsUnion>>(projection: TProjection): GroqExpression<ArrayElementProjectionResultType<TProjection>>;
}

function query<TType extends string, TFields extends Record<string, Field<any>>, TSource extends ObjectSchema<TType, TFields>>(o : TSource) : ObjectArrayExpression<{ [K in keyof TSource["fields"]]: ExpressionFromField<TFields[K]> } & { _type: TType }>{
    throw Error("Not implemented");
}

function union(...args: any[]) : any{
    throw Error("Not implemented");
}



const Article = {
    type: "article" as const,
    fields: {
        title: {} as Field<GroqExpression<string>>,
        linkUrl: {} as Field<GroqExpression<string>>,
        linkLabel: {} as Field<GroqExpression<string>>,
        author: {} as Field<ObjectExpression<{ _type: 'person', name: GroqExpression<string> }>>
    }
}

const Employee = {
    type: "person" as const,
    fields: {
        name: {} as Field<GroqExpression<string>>,
        email: {} as Field<GroqExpression<string>>,
    }

}

query(Article).map(a => ({
        link: {
            url: a.linkUrl,
            label: a.linkLabel
        },
        author: union(
            a.author.is(Employee, e => ({
                name: e.name
            })),
            a.author.is(ExternalContributor, e => ({
                name: e.name
            }))),
        body: a.body.map(b => union(
            b.is(TextBlock, t => ({
                text: t.text
            })),
            b.is(ImageBlock, i => ({
                url: i.url
            })
        ))
        }))