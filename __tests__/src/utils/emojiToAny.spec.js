const emojiToAny = require("../../../src/utils/emojiToAny.js");

describe("Emoji to Number/Boolean conversion", () => {
    test("emoji to number", () => {
        expect(emojiToAny("1⃣")).toBe(0);
    });
    test("emoji to boolean", () => {
        expect(emojiToAny("✅")).toBe(true);
    });
    test("wrong input type", () => {
        try{
            emojiToAny({"foo": "bar"})
        }catch(e){
            expect(e).toBeDefined();
            expect(e instanceof TypeError).toBe(true);
            expect(e.message).toBe("Expected string for first argument, got object");
        }
    });
});