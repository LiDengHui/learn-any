import { promiseAll } from "../src/index";

describe("promise-all", () => {
    // var promiseAll = Promise.all.bind(Promise);
    it("should return right number", async () => {
        const arr = [Promise.resolve(1), Promise.resolve(2)];

        const list = await promiseAll(arr);

        expect(list).toStrictEqual([1, 2]);
    });

    it("should return reject value", async () => {
        const arr = [Promise.resolve(1), Promise.reject(2)];

        await expect(promiseAll(arr)).rejects.toBe(2);
    });
});
