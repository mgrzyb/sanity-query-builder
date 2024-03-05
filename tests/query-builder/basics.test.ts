import { testType } from "type-plus"
import { from } from "../../src"
import { Article } from "../test-schema/Article";
import { QueryResultType } from "../utils";
import { ExtractValueTypeFromFieldsSchema } from "../../src/schema/fields/ObjectFieldSchema";

describe('Basic picks', () => {

    test('First query', () => {
        const q = from(Article);

        testType.equal<QueryResultType<typeof q>, ExtractValueTypeFromFieldsSchema<typeof Article["fields"]>>(true);

        expect(q.toString()).toBe('*[_type == "article"] { "title": title, "link": link, "category": category, "author": author, "body": body, "relatedArticles": relatedArticles }')
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