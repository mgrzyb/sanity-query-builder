import { testType } from "type-plus"
import { F, fetch } from "../src"
import { query } from "../src/QueryExpression"
import { union } from "../src/UnionExpression"
import { upper } from "../src/UpperExpression"
import { ExtractParams, GroqExpression, GroqExpressionType, GroqObjectType, ObjectAccessExpression, Ref } from "../src/GroqExpression"
import { GroqObjectFromObjectSchema } from "../src/ObjectSchema"
import { ExpandRecursively } from "./utils"
import { ObjectArrayField } from "../src/ObjectArrayField"
import { toGroq } from "../src/utils"
import { eq, or, and, select, neq, P } from "../src/Functions"

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
        body: F.objectArray([Hero, Quote], [Category])
    }
}

type WithExtraFields<T, TFields> = T & { fields: TFields };

export const Article: WithExtraFields<typeof ArticleBase, { relatedArticles: ObjectArrayField<never, () => typeof Article> }> = {
    ...ArticleBase,
    fields: { ...ArticleBase.fields, relatedArticles: F.referenceArray([() => Article]) }
};

type QueryResultType<T extends GroqExpression<any, any>> = GroqExpressionType<T>[number];

describe('Basic picks', () => {

    test('First query', () => {
        const q = query(Article);
        testType.equal<QueryResultType<typeof q>, GroqObjectType<GroqObjectFromObjectSchema<typeof Article>>>(true);

        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] { ... }`)
    })

    test('Field can be picked with an alias', () => {
        const q = query(Article).map(a => ({
            foo: a.title,
        }))
        testType.equal<QueryResultType<typeof q>, { foo: string }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"foo": title}`)
    })

    test('Field can be picked with basic projection', () => {
        const q = query(Article).map(a => ({
            foo: upper(a.title),
        }));
        testType.equal<QueryResultType<typeof q>, { foo: string }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"foo": upper(title)}`)
    });

    test('Projections can be applied to projections', () => {
        const q = query(Article).map(a => ({
            foo: upper(upper(a.title))
        }))
        testType.equal<QueryResultType<typeof q>, { foo: string }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"foo": upper(upper(title))}`)
    });

});

describe('Objects', () => {

    test('Pick the whole object', () => {
        const q = query(Article).map(a => ({
            link: a.link,
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { link: { url: string, label: string,/*  target: 'BLANK' | 'SELF' ,*/ _type: 'link' } }>(true);

        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"link": link}`)
    })

    test('Pick single property', () => {
        const q = query(Article).map(a => ({
            linkUrl: a.link.url,
        }));
        testType.equal<QueryResultType<typeof q>, { linkUrl: string }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"linkUrl": link.url}`)
    })

    test('Individual fields can be picked from objects', () => {
        const q = query(Article).map(a => ({
            link: {
                _type: a.link._type,
                url: a.link.url,
            }
        }));

        testType.equal<QueryResultType<typeof q>, { link: { url: string, _type: 'link' } }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"link": {"_type": link._type, "url": link.url}}`)
    })

    test('Furhter projections can be applied to object fields', () => {
        const q = query(Article).map(a => ({
            link: { url: upper(a.link.url) }
        }));
        testType.equal<QueryResultType<typeof q>, { link: { url: string } }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"link": {"url": upper(link.url)}}`)
    })
})


describe('References', () => {

    test('References can be picked', () => {
        const q = query(Article).map(a => ({
            cat: a.category
        }));
        testType.equal<QueryResultType<typeof q>, { cat: { _ref: string, _type: 'reference' } }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"cat": category}`)
    })

    test('References can be resolved to a single type', () => {
        const q = query(Article).map(a => ({
            cat: a.category.resolve(c => c)
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { cat: { _type: 'category', name: string } }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"cat": category->{...}}`)
    })

    test('References can be resolved to a union type', () => {
        const q = query(Article).map(a => ({
            author: a.author.resolve(a => a)
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { author: { _type: 'employee', name: string, position: string } | { _type: 'externalContributor', name: string, company: string } }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"author": author->{...}}`)
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
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"author": author->{"name": name}}`)
    })

    test('Rferenced objects can be picked conditionally depending on document type', () => {

        const externalContributorProjection = (contributor: GroqObjectFromObjectSchema<typeof ExternalContributor>) => ({
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
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"author": author->{_type, "name": name, _type == 'employee' => {"position": position}, _type == 'externalContributor' => {"company": company}}}`)
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

    test('Pick from union of embeded and referenced elements', () => {
        const q = query(Article).map(a => ({
            body: a.body.map(r => union(
                r.is(Category, c => ({ categoryName: c.name })),
                r.is(Hero, h => ({ heroHeading: h.heading }))
            )),
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { body: readonly ({ _type: 'category', categoryName: string } | { _type: 'hero', heroHeading: string })[] }>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"body": body[] {_type, (_type == "reference" && @->_type == "category") => @->{"categoryName": name}, _type == "hero" => {"heroHeading": heading}}}`)
    })

})

describe('Functions', () => {
    test('Select function', () => {
        const q = query(Article).map(a => ({
            authorIsEmployee: select(eq(a.author.resolve(a => a._type), "employee"), true),
            authorIsExternal: select(eq(a.author.resolve(a => a._type), "externalContributor"), true, false),
            linkUrl: a.link.url }));
            type FFFFFF = ExpandRecursively<QueryResultType<typeof q>>;

            testType.strictCanAssign<QueryResultType<typeof q>, { authorIsEmployee: boolean | null, authorIsExternal: boolean, linkUrl: string }>(true);
            expect(q.toGroq()).toBe(/* groq */`*[_type == "article"] {"authorIsEmployee": select(author->_type == "employee" => true), "authorIsExternal": select(author->_type == "externalContributor" => true, false), "linkUrl": link.url}`)
        });
})


describe('Filters', () => {

    test('Filter can be applied', () => {
        const q = query(Article).filter(a => eq(a.title, "foo"));
        testType.equal<QueryResultType<typeof q>, GroqObjectType<GroqObjectFromObjectSchema<typeof Article>>>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article" && title == "foo"] { ... }`)
    });

    test('And/Or can be used in filters', () => {
        const q = query(Article).filter(a => or(eq(a.title, "foo"), and(eq(a.title, "bar"), eq(a.category.resolve(c => c.name), "baz"))));
        testType.equal<QueryResultType<typeof q>, GroqObjectType<GroqObjectFromObjectSchema<typeof Article>>>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article" && (title == "foo" || (title == "bar" && category->name == "baz"))] { ... }`)
    });

    test('Projections can be used after filter is applied', () => {
        const q = query(Article).filter(a => eq(a.title, "foo")).map(a => a.title);
        testType.equal<QueryResultType<typeof q>, string>(true);
        expect(q.toGroq()).toBe(/* groq */`*[_type == "article" && title == "foo"] .title`)
    });

});


describe('Parameters', () => {
    test('Parameters can be used in filters', () => {
        const q = query(Article).filter(a => or(eq(a.title, P.string('title')), neq(a.author._ref, P.string('authorId'))));
        
        testType.equal<QueryResultType<typeof q>, GroqObjectType<GroqObjectFromObjectSchema<typeof Article>>>(true);
        testType.equal<ExtractParams<typeof q>, { title: string, authorId: string }>(true);

        expect(q.toGroq()).toBe(/* groq */`*[_type == "article" && (title == $title || author._ref != $authorId)] { ... }`);
    })
});

describe('Sample queries', () => {

    test('Query 1', () => {
        const q = query(Article)
            .filter(a => or(eq(a.title, P.string("title1")), eq(a.title, P.string("title2"))))
            .map(a => ({
                linkUrl: a.link.url,
                author: a.author.resolve(a => union(
                    {
                        name: a.name
                    },
                    a.is(Employee, e => ({ employeePosition: e.position })),
                    a.is(ExternalContributor, e => ({ externalCompany: e.company }))
                )),

                categoryName: a.category.resolve(c => c.name),

                body: a.body.map(b => union(
                    {
                        foo: "foo"
                    },

                    b.is(Hero, h => ({
                        text: h.heading
                    })),

                    b.is(Quote, q => ({
                        text: q.text
                    }))
                ))
            }));
            
        type ExpectedResultType = {
            linkUrl: string
            author: ({
                _type: 'employee'
                name: string
                employeePosition: string
            }) | ({
                _type: 'externalContributor'
                name: string
                externalCompany: string
            })
            categoryName: string,
            body: readonly ({
                _type: 'hero'
                text: string,
                foo: string
            } | {
                _type: 'quote'
                foo: string
                text: string
            })[]
        }

        testType.strictCanAssign<QueryResultType<typeof q>, ExpectedResultType>(true);
        testType.equal<ExtractParams<typeof q>, { title1: string, title2: string }>(true);
    });
});

