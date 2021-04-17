const intToEmoji = require("../../../src/utils/intToEmoji.js");

describe("Number to emoji conversion", () => {
    test("number to emoji", () => {
        expect(intToEmoji.main(0)).toBe("1⃣");
    });
    test("wrong input type for main", () => {
        try{
            intToEmoji.main({"foo": "bar"});
        }catch(e){
            expect(e).toBeDefined();
            expect(e instanceof TypeError).toBe(true);
            expect(e.message).toBe("Expected number for first argument, got object");
        }
    });
    test("boolean[] to emoji[]", () => {
        expect(intToEmoji.getArray([true,true,false,false,true,true,false])).toStrictEqual(["1⃣","2⃣","5⃣","6⃣"]);
    });
    test("wrong input type for getArray", () => {
        try{
            intToEmoji.getArray({"foo": "bar"});
        }catch(e){
            expect(e).toBeDefined();
            expect(e instanceof TypeError).toBe(true);
            expect(e.message).toBe("Expected array for first argument, got object");
        }
    });
});