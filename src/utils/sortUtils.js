const naturalComparator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});

const getComparatorResult = (res, ascending) => {
    if (ascending) return res;
    return res === 0 ? res : res * -1;
};

const normalize = (val) => (val == null ? '' : val);

const comparatorMap = {
    string: (a, b, ascending = true) => {
        const strA = normalize(a);
        const strB = normalize(b);
        const res = naturalComparator.compare(strA, strB);
        return getComparatorResult(res, ascending);
    },
    array: (a, b, ascending = true) => {
        const strA = Array.isArray(a) ? a.join(",") : normalize(a);
        const strB = Array.isArray(b) ? b.join(",") : normalize(b);
        const res = naturalComparator.compare(strA, strB);
        return getComparatorResult(res, ascending);
    },
    date: (a, b, ascending = true) => {
        const res = new Date(a) - new Date(b);
        return getComparatorResult(res, ascending);
    },
};

const getComparatorFunction = (type) => comparatorMap[type];

const deepGet = (obj, keys) => keys.reduce((xs, x) => xs?.[x] ?? null, obj);
const deepGetByPath = (obj, path) =>
    deepGet(
        obj,
        path
            .replace(/\[([^\[\]]*)\]/g, '.$1.')
            .split('.')
            .filter(t => t !== '')
    );

/**
 * Sort data based on column
 * 
 * @param {object} data - Data object containing all columns
 * @param {{ key: string, type: "string" | "array" | "date" }} column - Column to apply sorting
 * @param { "asc" | "desc" } order - Sort order
 * @returns Sorted data
 */
export function sortByColumn(data, column, order) {
    const { key, type } = column;
    const comparator = getComparatorFunction(type);
    return data
        .slice()
        .sort((a, b) =>
            comparator(deepGetByPath(a, key), deepGetByPath(b, key), order == "asc")
        );
};
