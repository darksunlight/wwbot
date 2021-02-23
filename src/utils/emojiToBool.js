const emojiToBool = {
    "✅": true,
    "❎": false
}
module.exports = x => {
    return emojiToBool[x];
}