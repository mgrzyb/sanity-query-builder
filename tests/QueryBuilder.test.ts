import { F, documentSchema, from, objectSchema } from "../src/QueryBuilder";
import { testType } from "type-plus"

const Hero = objectSchema({
    _type: "hero",
    fields: {
        heading: F.string()
    }
})

const Category = documentSchema({
    document: true,
    _type: "category",
    fields: {
        name: F.string()
    }
})

const Employee = documentSchema({
    document: true,
    _type: "person",
    fields: {
        name: F.string(),
        position: F.string()
    }
})

const ExternalContributor = documentSchema({
    document: true,
    _type: "externalContributor",
    fields: {
        name: F.string(),
        company: F.string()
    }
})

const Article = documentSchema({
    document: true,
    _type: "article",
    fields: {
        title: F.string(),
        link: F.object('link', {
            label: F.string(),
            url: F.string(),
            target: F.enum({ "BLANK": "_blank", "SELF": "_self" }),
        }),
        category: F.reference([Category]),
        author: F.reference([Employee, ExternalContributor])
    }
})

type QueryResultType<T extends { fetch: () => any }> = ReturnType<T['fetch']>[number];

describe('Basic picks', () => {

    test('First query', () => {
        const q = from(Article);
        
        testType.equal<QueryResultType<typeof q>, { 
            title: string, 
            link: { url: string, label: string, target: 'BLANK' | 'SELF' } & { _type: 'link' }, 
            category: { _ref: string, _type: 'reference' }, 
            author: { _ref: string, _type: 'reference' 
        } }>(true);

        expect(q.toString()).toBe('*[_type == "article"] { "title": title, "link": link, "category": category, "author": author }')
    })

    test('Field can be picked with an alias', () => {
        const q = from(Article).pick(a => ({
            foo: a.title,
        }))
        testType.equal<QueryResultType<typeof q>, { foo: string }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "foo": title }')
    })

    test('Field can be picked with basic projection', () => {
        const q = from(Article).pick(a => ({
            foo: a.title.toUpper(),
        }));
        testType.equal<QueryResultType<typeof q>, { foo: string }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "foo": upper(title) }')
    });

    test('Projections can be applied to projections', () => {
        const q = from(Article).pick(a => ({
            foo: a.title.toUpper().toUpper()
        }))
        testType.equal<QueryResultType<typeof q>, { foo: string }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "foo": upper(upper(title)) }')
    });

});

describe('Objects', () => {

    test('Pick the whole object', () => {
        const q = from(Article).pick(a => ({
            link: a.link,
        }));
        testType.equal<QueryResultType<typeof q>, { link: { url: string, label: string, target: 'BLANK' | 'SELF' } & { _type: 'link' } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "link": link }')
    })    

    test('Pick single property', () => {
        const q = from(Article).pick(a => ({
            linkUrl: a.link.url,
        }));
        testType.equal<QueryResultType<typeof q>, { linkUrl: string }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "linkUrl": link.url }')
    })    

    test('Individual fields can be picked from objects', () => {
        const q = from(Article).pick(a => ({
            link: a.link.pick(l => ({ 
                _type: l._type,
                url: l.url,
            })),
        }))
        testType.equal<QueryResultType<typeof q>, { link: { url: string, _type: 'link' } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "link": { "_type": link._type, "url": link.url } }')
    })    

    test('Individual fields can be picked from objects', () => {
        const q = from(Article).pick(a => ({
            link: a.link.pick(l => ({ url: l.url })),
        }));
        testType.equal<QueryResultType<typeof q>, { link: { url: string } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "link": { "url": link.url } }')
    })    

    test('Furhter projections can be applied to object fields', () => {
        const q = from(Article).pick(a => ({
            link: a.link.pick(l => ({ url: l.url.toUpper() })),
        }));
        testType.equal<QueryResultType<typeof q>, { link: { url: string } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "link": { "url": upper(link.url) } }')
    })    
 })

describe('References', () => {

    test('References can be picked', () => {
        const q = from(Article).pick(a => ({
            cat: a.category
        }));
        testType.equal<QueryResultType<typeof q>, { cat: { _ref: string, _type: 'reference' } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "cat": category }')
    })

    test('References can be resolved to a single type', () => {
        const q = from(Article).pick(a => ({
            cat: a.category.resolve()
        }));
        //testType.equal<QueryResultType<typeof q>, { cat: { _type: 'category', name: string } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "cat": category->{...} }')
    })

    test('References can be resolved to a union type', () => {
        const q = from(Article).pick(a => ({
            author: a.author.resolve()
        }));
        //testType.equal<QueryResultType<typeof q>, { author: { _type: 'author', name: string } | { _type: 'externalContributor', name: string, company: string } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "author": author->{...} }')
    })
    
    test('References can be resolved to a union type', () => {
        const q = from(Article).pick(a => ({
            author: a.author.pick(
                a => ({
                    name: a.name
                }),
                a => ({
                    foo: "bar"
                })
        }));
        //testType.equal<QueryResultType<typeof q>, { author: { _type: 'author', name: string } | { _type: 'externalContributor', name: string, company: string } }>(true);
        expect(q.toString()).toBe(`*[_type == "article"] { "author": author->{ _type == 'employee' => { "name": name }, _type == 'externalContributor' => { "name": name, "company": company }} }`)
    })    
})


function foo<T extends (()=>any)[]>(...a: T) : ReturnType<T[number]> {

}


foo(() => "aaa", ()=>({}))