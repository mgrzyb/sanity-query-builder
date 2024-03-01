import { testType } from "type-plus"
import { from } from "../../src"
import { Article } from "../TestSchema";
import { ExpandRecursively, QueryResultType } from "../utils";

describe('Basic picks', () => {

    test('First query', () => {
        const q = from(Article);

        testType.equal<QueryResultType<typeof q>, {
            title: string,
            link: { url: string, label: string, target: 'BLANK' | 'SELF' } & { _type: 'link' },
            category: { _ref: string, _type: 'reference' },
            author: {
                _ref: string, _type: 'reference'
            }
        }>(true);

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