export async function promiseAll(arr: Promise<any>[]): Promise<any[]> {
    const len = arr.length;
    const list: any[] = [];
    return new Promise((resolve, reject) => {
        arr.forEach(async (promise) => {
            let val;
            try {
                val = await promise;
            } catch (e) {
                reject(e);
            }
            list.push(val);
            if (list.length === len) {
                resolve(list);
            }
        });
    });
}
