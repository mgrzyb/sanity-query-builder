import { testType } from "type-plus";
import { from } from "../../src";
import { Article } from "../test-schema/Article";
import { ExternalContributor } from "../test-schema/ExternalContributor";
import { Employee } from "../test-schema/Employee";
import { Expand, ExpandRecursively, QueryResultType } from "../utils";
import { FieldsAccessor } from "../../src/schema/FieldSchema";

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
        testType.strictCanAssign<QueryResultType<typeof q>, { cat: { _type: 'category', name: string } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "cat": category->{...} }')
    })

    test('References can be resolved to a union type', () => {
        const q = from(Article).pick(a => ({
            author: a.author.resolve()
        }));
        type FFF = ExpandRecursively<QueryResultType<typeof q>>;
        testType.strictCanAssign<QueryResultType<typeof q>, { author: { _type: 'person', name: string, position: string } | { _type: 'externalContributor', name: string, company: string } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "author": author->{...} }')
    })

    test('Rferenced objects can be picked', () => {
        const q = from(Article).pick(a => {
            return ({
                author: a.author.pick(author => ({
                    name: author.name
                }))
            });
        });
        testType.strictCanAssign<QueryResultType<typeof q>, { author: { name: string } }>(true);
        expect(q.toString()).toBe(`*[_type == "article"] { "author": author->{ "name": name } }`)
    })

    test('Rferenced objects can be picked conditionally depending on document type', () => {

        const externalContributorProjection = (contributor : FieldsAccessor<typeof ExternalContributor["fields"]>) => ({
            company: contributor.company
        })

        const q = from(Article).pick(a => ({
            author: a.author.pick(
                a => ({
                    name: a.name
                }),

                a => a.ofType(Employee, e => ({
                    position: e.position
                })),

                a => a.ofType(ExternalContributor, externalContributorProjection)
            )
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { author: { name: string } | { _type: typeof Employee._type, name: string, position: string } | { _type: typeof ExternalContributor._type, name: string, company: string } }>(true);
        expect(q.toString()).toBe(`*[_type == "article"] { "author": author->{ _type, "name": name, _type == 'person' => { "position": position }, _type == 'externalContributor' => { "company": company } } }`)
    })
})