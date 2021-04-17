const intToEmoji = ["1⃣","2⃣","3⃣","4⃣","5⃣","6⃣","7⃣","8⃣","9⃣","🔟","🅰️","🅱️"];

/**
 * 
 * @param {number} x 
 * @returns {string} emoji
 */
module.exports.main = x => {
    if(typeof x !== "number") {
        throw new TypeError(`Expected number for first argument, got ${typeof x}`);
    }
    return intToEmoji[x];
}

/**
 * 
 * @param {boolean[]} x 
 * @returns 
 */
module.exports.getArray = x => {
    if(!(x instanceof Array)) {
        throw new TypeError(`Expected array for first argument, got ${typeof x}`);
    }
    let newArray = [];
    for (let i = 0; i < x.length; i++){
        if(x[i]) newArray.push(intToEmoji[i]);
    }
    return newArray;
}