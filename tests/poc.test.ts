import { testType } from "type-plus"
import { F } from "../poc"
import { query } from "../poc/QueryExpression"
import { union } from "../poc/UnionExpression"
import { upper } from "../poc/UpperExpression"
import { GroqExpression, GroqExpressionType, GroqObjectType, Ref } from "../poc/GroqExpression"
import { GroqObjectFromObjectSchema, ObjectSchema } from "../poc/ObjectSchema"
import { ExpandRecursively } from "./utils"
import { ObjectArrayField } from "../poc/ObjectArrayField"
import { SimpleField, SimpleFieldAccessExpression } from "../poc/SimpleField"
import { ObjectField } from "../poc/ObjectField"
import { ExpandObjectAccessExpressions, ExpressionFromField } from "../poc/Field"

const Category = {
    type: "category" as const,
    fields: {
        name: F.string()
    }
}

const Employee = {
    type: "employee" as const,
    fields: {
        name: F.string(),
        position: F.string()
    }
}

const ExternalContributor = {
    type: "externalContributor" as const,
    fields: {
        name: F.string(),
        company: F.string()
    }
}

const Hero = {
    type: "hero" as const,
    fields: {
        heading: F.string()
    }
}

const Quote = {
    type: "quote" as const,
    fields: {
        text: F.string(),
        author: F.string()
    }
}

const ArticleBase = {
    type: "article" as const,
    fields: {
        title: F.string(),
        link: F.object({
            type: "link" as const,
            fields: {
                label: F.string(),
                url: F.string(),
                //target: F.enum({ "BLANK": "_blank", "SELF": "_self" })
            }
        }),
        category: F.reference([Category]),
        author: F.reference([Employee, ExternalContributor]),
        body: F.objectArray([Hero, Quote])
    }
}

type FFFFFFFF = ExpressionFromField<SimpleField<SimpleFieldAccessExpression<string>>>
type WithExtraFields<T, TFields> = T & { fields: TFields };

export const Article : WithExtraFields<typeof ArticleBase, { relatedArticles: ObjectArrayField<never, ()=>typeof Article> }> = {
    ...ArticleBase, 
    fields: {...ArticleBase.fields, relatedArticles: F.referenceArray([()=>Article])}};


type FFFFF = GroqObjectFromObjectSchema<typeof Article> | (never extends ObjectSchema<any, any> ? {_type: GroqExpression<'reference'>, "_ref": GroqExpression<string> } : never)

type QueryResultType<T extends GroqExpression<any>> = GroqExpressionType<T>[number];

describe('Basic picks', () => {

    test('First query', () => {
        const q = query(Article);
        testType.equal<QueryResultType<typeof q>, GroqObjectType<GroqObjectFromObjectSchema<typeof Article>>>(true);

        expect(q.toGroq()).toBe('*[_type == "article"] { ... }')
    })

    test('Field can be picked with an alias', () => {
        const q = query(Article).map(a => ({
            foo: a.title,
        }))
        testType.equal<QueryResultType<typeof q>, { foo: string }>(true);
        expect(q.toGroq()).toBe('*[_type == "article"] {"foo": title}')
    })

    test('Field can be picked with basic projection', () => {
        const q = query(Article).map(a => ({
            foo: upper(a.title),
        }));
        testType.equal<QueryResultType<typeof q>, { foo: string }>(true);
        expect(q.toGroq()).toBe('*[_type == "article"] {"foo": upper(title)}')
    });

    test('Projections can be applied to projections', () => {
        const q = query(Article).map(a => ({
            foo: upper(upper(a.title))
        }))
        testType.equal<QueryResultType<typeof q>, { foo: string }>(true);
        expect(q.toGroq()).toBe('*[_type == "article"] {"foo": upper(upper(title))}')
    });

});

describe('Objects', () => {

    test('Pick the whole object', () => {
        const q = query(Article).map(a => ({
            link: a.link,
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { link: { url: string, label: string,/*  target: 'BLANK' | 'SELF' ,*/ _type: 'link' } }>(true);

        expect(q.toGroq()).toBe('*[_type == "article"] {"link": link}')
    })

    test('Pick single property', () => {
        const q = query(Article).map(a => ({
            linkUrl: a.link.url,
        }));
        testType.equal<QueryResultType<typeof q>, { linkUrl: string }>(true);
        type FFFFFF = ExpandRecursively<QueryResultType<typeof q>>;
        expect(q.toGroq()).toBe('*[_type == "article"] {"linkUrl": link.url}')
    })

    test('Individual fields can be picked from objects', () => {
        const q = query(Article).map(a => ({
            link: {
                _type: a.link._type,
                url: a.link.url,
            }
        }));

        testType.equal<QueryResultType<typeof q>, { link: { url: string, _type: 'link' } }>(true);
        expect(q.toGroq()).toBe('*[_type == "article"] {"link": {"_type": link._type, "url": link.url}}')
    })

    test('Furhter projections can be applied to object fields', () => {
        const q = query(Article).map(a => ({
            link: { url: upper(a.link.url) }
        }));
        testType.equal<QueryResultType<typeof q>, { link: { url: string } }>(true);
        expect(q.toGroq()).toBe('*[_type == "article"] {"link": {"url": upper(link.url)}}')
    })
})


describe('References', () => {

    test('References can be picked', () => {
        const q = query(Article).map(a => ({
            cat: a.category
        }));
        testType.equal<QueryResultType<typeof q>, { cat: { _ref: string, _type: 'reference' } }>(true);
        expect(q.toGroq()).toBe('*[_type == "article"] {"cat": category}')
    })

    test('References can be resolved to a single type', () => {
        const q = query(Article).map(a => ({
            cat: a.category.resolve(c => c)
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { cat: { _type: 'category', name: string } }>(true);
        expect(q.toGroq()).toBe('*[_type == "article"] {"cat": category->{...}}')
    })

    test('References can be resolved to a union type', () => {
        const q = query(Article).map(a => ({
            author: a.author.resolve(a => a)
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { author: { _type: 'employee', name: string, position: string } | { _type: 'externalContributor', name: string, company: string } }>(true);
        expect(q.toGroq()).toBe('*[_type == "article"] {"author": author->{...}}')
    })

    test('Rferenced objects can be picked', () => {
        const q = query(Article).map(a => {
            return ({
                author: a.author.resolve(author => ({
                    name: author.name
                }))
            });
        });
        testType.strictCanAssign<QueryResultType<typeof q>, { author: { name: string } }>(true);
        expect(q.toGroq()).toBe(`*[_type == "article"] {"author": author->{"name": name}}`)
    })

    test('Rferenced objects can be picked conditionally depending on document type', () => {

        const externalContributorProjection = (contributor : GroqObjectFromObjectSchema<typeof ExternalContributor>) => ({
            company: contributor.company
        })

        const q = query(Article).map(a => ({
            author: a.author.resolve(author => union({
                    name: author.name
                },
                author.is(Employee, e => ({
                    position: e.position
                })),
                author.is(ExternalContributor, externalContributorProjection)
            ))
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { author: { name: string } | { _type: typeof Employee.type, name: string, position: string } | { _type: typeof ExternalContributor.type, name: string, company: string } }>(true);
        expect(q.toGroq()).toBe(`*[_type == "article"] {"author": author->{_type, "name": name, _type == 'employee' => {"position": position}, _type == 'externalContributor' => {"company": company}}}`)
    })
})



describe('Object arrays', () => {

    test('Pick the whole array', () => {
        const q = query(Article).map(a => ({
            relatedArticles: a.relatedArticles,
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { relatedArticles: readonly Ref[] }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"relatedArticles": relatedArticles}`)
    })

    test('Map references', () => {
        const q = query(Article).map(a => ({
            relatedArticles: a.relatedArticles.map(r => r._ref),
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { relatedArticles: readonly string[] }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"relatedArticles": relatedArticles[] ._ref}`)
    })
    
    test('Pick object from referenced elements', () => {
        const q = query(Article).map(a => ({
            relatedArticles: a.relatedArticles.map(r => r.is(Article, a => ({ "title": a.title }))),
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { relatedArticles: readonly { title: string }[] }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"relatedArticles": relatedArticles[] {(_type == "reference" && @->_type == "article") => @->{"title": title}}}`)
        type FFF = ExpandRecursively<QueryResultType<typeof q>>;
    }) 

    test('Pick object from referenced elements', () => {
        const q = query(Article).map(a => ({
            relatedArticles: a.relatedArticles.map(r => ({ title: r.is(Article, a => a.title) })),
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { relatedArticles: readonly { title: string }[] }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"relatedArticles": relatedArticles[] {"title": select((_type == "reference" && @->_type == "article") => @->title)}}`)
        type FFF = ExpandRecursively<QueryResultType<typeof q>>;
    }) 

    test('Pick value from referenced elements', () => {
        const q = query(Article).map(a => ({
            relatedTitles: a.relatedArticles.map(r => r.is(Article, a => a.title)),
        }));        
        testType.strictCanAssign<QueryResultType<typeof q>, { relatedTitles: readonly string[] }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"relatedTitles": relatedArticles[] {"foo": select((_type == "reference" && @->_type == "article") => @->title)}[].foo}`)
    })          
})


const _q = query(Article).map(a => ({
    linkUrl: a.link.url,

    author: a.author.resolve(a => union({
            name: a.name
        },
        a.is(Employee, e => ({ position: e.position })),
        a.is(ExternalContributor, e => ({ externalCompany: e.company }))
    )),

    category: a.category.resolve(c => union(
        {
            name: c.name
        },
        c.is(Category, c => ({
            foo: c.name
        }))
    )),

    body: a.body.map(b => {
        const newLocal = union(
            {
                foo: "foo"
            },

            b.is(Hero, h => ({
                text: h.heading
            })),

            b.is(Quote, q => ({
                text: q.text
            }))
        );

        return newLocal;
    })
}))

describe('Foo bar', () => {

    test('Foo', () => {
        const groq = _q.toGroq();
        console.log(groq);
    })
});


