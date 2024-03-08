interface GroqExpression<TReturnType> {
    toGroq(): string
}

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



type ArrayElementProjection<TElementsUnion extends AnyTypedGroqObject<any>> = (e: TElementsUnion) => any

type ArrayElementProjectionsResultType<TProjections extends ArrayElementProjection<any>[]> = GroqExpressionType<ReturnType<TProjections[number]>>

interface ObjectArrayExpression<TElementsUnion extends AnyTypedGroqObject<any>> extends GroqExpression<readonly (GroqObjectUnionType<TElementsUnion>)[]> {
    map<TProjections extends ArrayElementProjection<TElementsUnion>[]>(...projections: TProjections): GroqExpression<ArrayElementProjectionsResultType<TProjections>>;
}

function query<TType extends string, TSource extends AnyTypedGroqObject<TType>(o : TSource) : ObjectArrayExpression<TObject>{
    throw Error("Not implemented");
}

function union(...args: any[]) : any{
    throw Error("Not implemented");
}



const Article = {
    title: new FieldAccessExpression()
}


query(Article)


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