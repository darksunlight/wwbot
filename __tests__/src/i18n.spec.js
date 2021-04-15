const i18n = require("../../src/i18n.js");
describe("i18n framework", () => {
    test("{{PLURAL:...}} processing (even Number)", () => {
        expect(i18n("seconds", "en", 2)).toBe("2 seconds");
    });
    test("{{PLURAL:...}} processing (odd Number)", () => {
        expect(i18n("seconds", "en", 1)).toBe("1 second");
    });
    test("{{PLURAL:...}} processing (not a Number)", () => {
        try{
            i18n("seconds", "en", "asdfhgk");
        }catch(e){
            expect(e).toBeDefined();
        }
    });
    test("key not found", () => {
        expect(i18n("xx-no", "en", 2)).toBe("xx-no");
    });
});