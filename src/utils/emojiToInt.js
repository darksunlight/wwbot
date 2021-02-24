const emojiToInt = {
    "1⃣": 0,
    "2⃣": 1,
    "3⃣": 2,
    "4⃣": 3,
    "5⃣": 4,
    "6⃣": 5,
    "7⃣": 6,
    "8⃣": 7,
    "9⃣": 8,
    "🔟": 9,
    "🅰️": 10,
    "🅱️": 11
}

/**
 * 
 * @param {string} x 
 * @returns {number}
 */
module.exports = x => {
    return emojiToInt[x];
}