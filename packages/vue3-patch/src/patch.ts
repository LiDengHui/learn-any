export interface Node {
    key: number;
}

/**
 *
 * @param arrA 旧的节点
 * @param arrB 新的节点
 */
export const patchKeyedChildren = (arrA: Node[], arrB: Node[]) => {
    let start = 0;
    let endA = arrA.length - 1;
    let endB = arrB.length - 1;

    console.log('旧节点:', JSON.stringify(arrA))
    console.log('新节点:', JSON.stringify(arrB))
    while (start <= endA && start <= endB) { // 去掉共有头节点
        const itemA = arrA[start];
        const itemB = arrB[start];
        if (itemA.key === itemB.key) {
            start++;
        } else {
            break;
        }
    }

    while (start <= endA && start <= endB) { // 去掉共有尾节点
        const itemA = arrA[endA];
        const itemB = arrB[endB];
        if (itemA.key === itemB.key) {
            endA--;
            endB--;
        } else {
            break;
        }
    }

    if (start > endA) {
        if (start <= endB) { // 旧的子节点遍历完了，发现新的子节点还没有遍历完
            console.log(`添加arrB上剩余的节点1: ${[start, endB]}`)
        }
    } else if (start > endB) {
        if (start <= endA) { // 新的子节点遍历完了，发现就的子节点还没有遍历完
            console.log(`卸载arrA上剩余的节点2: ${[start, endB]}`)
        }
    } else {
        const startA = start;
        const startB = start;

        // 生成新VNode节点Key对应的IndexMap
        const keyToNewIndexMap = new Map();
        for (start = startB; start <= endB; start++) {
            const current = arrB[start];
            keyToNewIndexMap.set(current.key, start)
        }

        console.log('keyToNewIndexMap:', keyToNewIndexMap)
        let patched = 0;
        let moved = false;
        // 新的操作节点数组的长度
        let toBePatched = endB - startB + 1;

        // 记录当前最大遍历Index
        let maxNewIndexSoFar = 0;

        // 相对新的Index对应旧的Index数组
        const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
        // 遍历oldNode
        for (start = startA; start <= endA; start++) {

            if (patched >= toBePatched) {
                // all new children have been patched so this can only be a removal
                console.log('卸载当前节点2') // 说明旧的节点个数大于新的节点个数，需要删除剩下的；
                continue
            }
            const preChild = arrA[start];
            let newIndex: number | undefined;
            // 当存在key值时
            if (preChild.key != null) {
                newIndex = keyToNewIndexMap.get(preChild.key); // 如果查到了值说明当前节点是迁移节点，否则是删除节点
            }

            if (newIndex === undefined) {
                console.log('卸载当前节点3', preChild)
            } else {
                // 新节点存在时，存储 新节点剩余数组Index ，对应旧节点的Index
                newIndexToOldIndexMap[newIndex - startB] = start + 1;
                if (newIndex >= maxNewIndexSoFar) {
                    maxNewIndexSoFar = newIndex;
                } else { // 当newIndex < maxNewIndexSoFar的时候就说明，newIndex这一项是从旧的节点数组中移动到新的位置的更前放
                    moved = true;
                }
                patched++;
            }
        }
        console.log('newIndexToOldIndexMap:', newIndexToOldIndexMap)
        // 获取最大递增子序列
        const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];

        console.log('increasingNewIndexSequence:', increasingNewIndexSequence)
        let j = increasingNewIndexSequence.length - 1;


        // 从后向前遍历 新Index对应旧的Index，newIndexToOldIndexMap， increasingNewIndexSequence，
        for (let i = toBePatched - 1; i > 0; i--) {
            // 新的节点Index没有找到对应的旧的节点， 所以当前为新的节点

            if (newIndexToOldIndexMap[i] === 0) {
                console.log('挂载当前节点2', '新节点在当前位置', i + startB, arrB[i + startB])
            } else if (moved) {
                // 如果在最大递增子序列中没有找到，说明当前节点在递增子序列之间存在节点，需要插入
                // 如果在最大递增子序列遍历完成后，新增的节点依然没有遍历完成，说明要在 对头插入节点
                if (j < 0 || i !== increasingNewIndexSequence[j]) {
                    console.log('移动当前节点1', i, arrB[i + startB], '=>', i + startB, '前')
                } else {
                    j--
                }
            }
        }
    }
    return true;
}


function getSequence(arr: number[]): number[] {
    const p = arr.slice()
    const result = [0]
    let i, j, u, v, c
    const len = arr.length
    for (i = 0; i < len; i++) {
        const arrI = arr[i]
        if (arrI !== 0) {
            j = result[result.length - 1]
            if (arr[j] < arrI) {
                p[i] = j
                result.push(i)
                continue
            }
            u = 0
            v = result.length - 1
            while (u < v) {
                c = ((u + v) / 2) | 0
                if (arr[result[c]] < arrI) {
                    u = c + 1
                } else {
                    v = c
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1]
                }
                result[u] = i
            }
        }
    }
    u = result.length
    v = result[u - 1]
    while (u-- > 0) {
        result[u] = v
        v = p[v]
    }
    return result
}