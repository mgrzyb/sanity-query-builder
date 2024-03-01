import { testType } from "type-plus";
import { from } from "../../src";
import { Article, Employee, ExternalContributor } from "../TestSchema";
import { Expand, ExpandRecursively, QueryResultType } from "../utils";

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
        testType.strictCanAssign<QueryResultType<typeof q>, { author: { _type: 'person', name: string, position: string } | { _type: 'externalContributor', name: string, company: string } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "author": author->{...} }')
    })

    test('Rferenced objects can be picked', () => {
        const q = from(Article).pick(a => ({
            author: a.author.pick(author => ({
                nsme: author.name
            }))
        }));

        testType.strictCanAssign<QueryResultType<typeof q>, { author: { name: string } }>(true);
        expect(q.toString()).toBe(`*[_type == "article"] { "author": author->{ "name": name, _type == 'employee' => { "position": position }, _type == 'externalContributor' => { "company": company }} }`)
    })

    test('Rferenced objects can be picked conditionally depending on document type', () => {
        const q = from(Article).pick(a => ({
            author: a.author.pick(
                author => ({
                    name: author.name
                }),

                a => a.ofType(Employee, employee => ({
                    position: employee.position
                })),

                a => a.ofType(ExternalContributor, contributor => ({
                    company: contributor.company
                }))
            )
        }));

        testType.strictCanAssign<QueryResultType<typeof q>, { author: { _type: typeof Employee._type, name: string, position: string } | { _type: typeof ExternalContributor._type, name: string, company: string } }>(true);
        expect(q.toString()).toBe(`*[_type == "article"] { "author": author->{ "name": name, _type == 'employee' => { "position": position }, _type == 'externalContributor' => { "company": company }} }`)
    })
})