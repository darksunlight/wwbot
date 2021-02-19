const emojiToInt = {
    "1⃣": 1,
    "2⃣": 2,
    "3⃣": 3,
    "4⃣": 4,
    "5⃣": 5,
    "6⃣": 6,
    "7⃣": 7,
    "8⃣": 8,
    "9⃣": 9,
    "🔟": 10,
    "🅰️": 11,
    "🅱️": 12
}
module.exports = x => {
    return emojiToInt[x];
}