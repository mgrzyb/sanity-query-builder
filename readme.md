This is a POC of a typed groq/sanity query builder and very much WIP.
The goal is to not only have the results of the queries typed but also get type support when writing queries.

Define your schema:

```ts
const Article = {
    type: "article" as const,
    fields: {
        title: F.string(),
        link: F.object({
            type: "link" as const,
            fields: {
                label: F.string(),
                url: F.string(),
                target: F.enum({ "BLANK": "_blank", "SELF": "_self" })
            }
        }),
        category: F.reference([Category]),
        author: F.reference([Employee, ExternalContributor]),
        body: F.objectArray([Hero, Quote], [Category])  // Objects and references
    }
}
```

Build queries:

```ts
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
```

Enjoy types:

```ts
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
```

More exmaples in `tests/poc.test.ts`