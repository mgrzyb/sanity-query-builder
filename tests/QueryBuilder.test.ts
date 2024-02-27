import { F, documentSchema, from, objectSchema } from "../src/QueryBuilder";

const Hero = objectSchema({
    _type: "hero",
    fields: {
    }
})

const Category = documentSchema({
    document: true,
    _type: "category",
    fields: {
    }
})

const Article = documentSchema({
    document: true,
    _type: "article",
    fields: {
        foo: F.string(),
        category: F.reference(Category),
    }
})

describe('Foo', () => {
    test('Bar', () => {
        expect(from(Article).pick(a => ({
            title: a.foo,
        })).toString()).toBe('*[_type == "article"] { "title": foo }')

        expect(from(Article).pick(a => ({
            title: a.foo.toUpper(),
        })).toString()).toBe('*[_type == "article"] { "title": foo.toUpper() }')

        expect(from(Article).pick(a => ({
            title: a.foo.toUpper().toUpper(),
        })).toString()).toBe('*[_type == "article"] { "title": foo.toUpper().toUpper() }')

    });
});