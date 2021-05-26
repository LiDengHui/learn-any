import {patchKeyedChildren, Node} from "../src/patch";

describe('patchKeyedChildren', () => {
    const arrA: Node[] = [
        {
            key: 1,
        }, {
            key: 2,
        }, {
            key: 3,
        }, {
            key: 4,
        }, {
            key: 5,
        }, {
            key: 6,
        }, {
            key: 7,
        }, {
            key: 8,
        },
        {
            key: 9
        }, {
            key: 10
        }
    ];

    const arrB: Node[] = [
        {
            key: 1
        },
        {
            key: 9,
        },
        {
            key: 11,
        },
        {
            key: 7,
        }, {
            key: 3,
        }, {
            key: 4,
        }, {
            key: 5,
        }, {
            key: 6
        }, {
            key: 2,
        }, {
            key: 10
        }
    ]

    it('test', () => {
        expect(patchKeyedChildren(arrA, arrB)).toBe(true)
    })
})