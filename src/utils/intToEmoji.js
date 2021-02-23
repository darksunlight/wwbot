const intToEmoji = ["1⃣","2⃣","3⃣","4⃣","5⃣","6⃣","7⃣","8⃣","9⃣","🔟","🅰️","🅱️"];
module.exports.main = x => {
    return intToEmoji[x];
}
module.exports.getArray = x => {
    let newArray = [];
    for (let i = 0; i < x; i++){
        newArray.push(intToEmoji[i]);
    }
    return newArray;
}