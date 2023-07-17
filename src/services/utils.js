
export function filterMapKeys(map, re) {
    const result = {};
    for (const [key, value] of map) {
        if (re.test(key)) {
            result[key] = value;
        }
    }
    return result;
}

export function findMostPopularTag(refTags, treshold, callback) {
    if (refTags && callback) {
        const mostPopular = Object.entries(refTags).sort((e1, e2) => e2[1] - e1[1])[0];
        if (mostPopular) {
            const [tagKey, tagCount] = mostPopular;
            if (tagCount > treshold) {
                callback(tagKey);
            }
        }
    }
}

