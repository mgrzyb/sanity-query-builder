interface Field<T extends GroqExpression<any>> {
    __type: T;
}

interface ObjectSchema<TType extends string, TFields extends Record<string, Field<any>>> {
    type: TType
    fields: TFields
}

interface GroqExpression<TReturnType> {
    __reutnType: TReturnType;
    toGroq(): string
}

type UnionToSum<T> = (T extends any ? (k: T) => void : never) extends ((k: infer I) => void) ? I : never
type ExpressionFromField<T extends Field<any>> = T extends Field<infer TExpression> ? 
    TExpression extends ObjectAccessExpression<infer TO> ? 
        TExpression & TO : 
        TExpression : 
    never

type AnyGroqObject = Record<string, GroqExpression<any>>
type AnyTypedGroqObject<TType extends string> = { _type: GroqExpression<TType> } & AnyGroqObject;

type GroqExpressionOrObject = GroqExpression<any> | Record<string, any> | string | number

type GroqObjectType<T extends AnyGroqObject> = { [K in keyof T]: GroqExpressionType<T[K]> }
type GroqObjectUnionType<T extends AnyGroqObject> = T extends AnyGroqObject ? GroqObjectType<T> : never;

type GroqExpressionType<T extends GroqExpressionOrObject> = T extends GroqExpression<infer T> ? T : T extends Record<string, any> ? Foo<T> : T;
type Foo<T extends Record<string, any>> = { [K in keyof T]: GroqExpressionType<T[K]> }

class SimpleFieldAccessExpression<T> implements GroqExpression<T> {
    __reutnType: T;
    constructor(private readonly fieldName: string) { }
    toGroq() {
        return this.fieldName
    }
}
7
interface ConditionalExpression<T> extends GroqExpression<T> {
}

interface ObjectAccessExpression<TObject extends AnyTypedGroqObject<any>> extends GroqExpression<GroqObjectType<TObject>> {
}

interface ObjectUnionAccessExpression<TObjectsUnion extends AnyTypedGroqObject<any>> extends GroqExpression<GroqObjectUnionType<TObjectsUnion>> {
    is<T extends ObjectSchema<any, any>, TProjection extends (e: { _type: GroqExpression<T["type"]> } & { [K in keyof T["fields"]]: ExpressionFromField<T["fields"][K]> }) => any>(type: T, projection: TProjection): ConditionalExpression<GroqExpressionType<ReturnType<TProjection>> & { _type: T["type"] }>
}

type ResolvedReferenceProjection<TObjectsUnion extends AnyTypedGroqObject<any>> = (e: ObjectUnionAccessExpression<TObjectsUnion> & TObjectsUnion) => any
type ResolvedReferenceProjectionResultType<TProjection extends ResolvedReferenceProjection<any>> = GroqExpressionType<ReturnType<TProjection>>

interface ReferenceAccessExpression<TObjectsUnion extends AnyTypedGroqObject<any>> extends GroqExpression<GroqObjectUnionType<TObjectsUnion>> {
    resolve<TProjection extends ResolvedReferenceProjection<TObjectsUnion>>(projection: TProjection): GroqExpression<ResolvedReferenceProjectionResultType<TProjection>>;
}


type ArrayElementProjection<TElementsUnion extends AnyTypedGroqObject<any>> = (e: ObjectUnionAccessExpression<TElementsUnion> & TElementsUnion) => any
type ArrayElementProjectionResultType<TProjection extends ArrayElementProjection<any>> = GroqExpressionType<ReturnType<TProjection>>

interface ObjectArrayAccessExpression<TElementsUnion extends AnyTypedGroqObject<any>> extends GroqExpression<readonly (GroqObjectUnionType<TElementsUnion>)[]> {
    map<TProjection extends ArrayElementProjection<TElementsUnion>>(projection: TProjection): GroqExpression<readonly ArrayElementProjectionResultType<TProjection>[]>;
}

class ObjectArrayFieldAccessExpression<TElementsUnion extends AnyTypedGroqObject<any>> implements ObjectArrayAccessExpression<TElementsUnion> {
    __reutnType: readonly GroqObjectUnionType<TElementsUnion>[];
    constructor(private readonly fieldName, ...elements: TElementsUnion[]) { }
    map<TProjection extends ArrayElementProjection<TElementsUnion>>(projection: TProjection): GroqExpression<readonly ArrayElementProjectionResultType<TProjection>[]> {
        throw new Error("Method not implemented.")
    }
    toGroq(): string {
        return this.fieldName
    }
}
function query<TSource extends ObjectSchema<any, any>>(o: TSource): ObjectArrayAccessExpression<{ [K in keyof TSource["fields"]]: ExpressionFromField<TSource["fields"][K]> } & { _type: GroqExpression<TSource["type"]> }> {
    throw Error("Not implemented");
}

type Bar<T> = [T] extends [never] ? {} : T
type UnionResultType<T extends GroqExpressionOrObject> = 
    UnionToSum<(T extends ConditionalExpression<any> ? { } : GroqExpressionType<T>)> & 
    Bar<T extends ConditionalExpression<any> ? GroqExpressionType<T> : never>

function union<TArgs extends GroqExpressionOrObject[]>(...args: TArgs): GroqExpression<UnionResultType<TArgs[number]>> {
    throw Error("Not implemented");
}

function fetch<T>(q : GroqExpression<T>) : T {
    throw Error("Not implemented");    
}


const Article = {
    type: "article" as const,
    fields: {
        title: {} as Field<GroqExpression<string>>,
        linkUrl: {} as Field<GroqExpression<string>>,
        linkLabel: {} as Field<GroqExpression<string>>,
        author: {} as Field<ObjectAccessExpression<{ _type: GroqExpression<'person'>, name: GroqExpression<string> }>>,
        body: {} as Field<ObjectArrayFieldAccessExpression<{ _type: GroqExpression<'text'>, text: GroqExpression<string> } | { _type: GroqExpression<'image'>, url: GroqExpression<string> }>>,
        category: {} as Field<ReferenceAccessExpression<{ _type: GroqExpression<'category'>, name: GroqExpression<string> }>>,
    }
}

const category = {
    type: "category" as const,
    fields: {
        name: {} as Field<GroqExpression<string>>,
    }
}

const Employee = {
    type: "person" as const,
    fields: {
        name: {} as Field<GroqExpression<string>>,
        position: {} as Field<GroqExpression<string>>,
    }
}

const ExternalContributor = {
    type: "externalContributor" as const,
    fields: {
        name: {} as Field<GroqExpression<string>>,
        company: {} as Field<GroqExpression<string>>,
    }
}

const TextBlock = {
    type: "text" as const,
    fields: {
        text: {} as Field<GroqExpression<string>>,
    }
}

const ImageBlock = {
    type: "image" as const,
    fields: {
        url: {} as Field<GroqExpression<string>>,
    }
}

const q = query(Article).map(a => ({
    link: {
        url: a.linkUrl,
        label: a.linkLabel
    },

    author: ({
        name: a.author.name,
        position: "author"
    }),

    category: a.category.resolve(c => union(
        {
            name: c.name
        },
        c.is(category, c => ({
            foo: c.name
        }))
    )),

    body: a.body.map(b => {
        const newLocal = union(
            {
                foo: "foo"
            },

            b.is(TextBlock, t => ({
                text: t.text
            })),

            b.is(ImageBlock, i => ({
                url: i.url
            }))
        );

        return newLocal;
    })
}))

const [r] = fetch(q)
r.category.name

export type ExpandRecursively<T> = T extends object
    ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
    : T;

type FFFFF = typeof r["body"];


type B<T> = [T] extends [never] ? "T" : "F"
type FFFFFF = B<string | never | never>