import { F } from "../poc"
import { query } from "../poc/QueryExpression"
import { union } from "../poc/UnionExpression"

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

const TextBlock = {
    type: "text" as const,
    fields: {
        text: F.string()
    }
}

const ImageBlock = {
    type: "image" as const,
    fields: {
        url: F.string()
    }
}

const Article = {
    type: "article" as const,
    fields: {
        title: F.string(),
        link: F.object({ type: 'link', fields: { title: F.string(), url: F.string() } }),
        author: F.reference([Employee, ExternalContributor]),
        body: F.objectArray([TextBlock, ImageBlock]),
        category: F.reference([Category]),
    }
}

const q = query(Article).map(a => ({
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

describe('Foo bar', () => {

    test('Foo', () => {
        const groq = q.toGroq();
        console.log(groq);
    })
});


