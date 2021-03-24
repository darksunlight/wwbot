/**
 * 
 * @param {string} key - i18n string identifying key
 * @param {string} lang - ISO639 code
 */
module.exports = (key, lang, ...args) => {
    //console.log(args.length);
    if (lang=="qqx") {
        if (args.length == 0) {
            return `(${key})`;
        } else {
            let qqx = `(${key}: `;
            for(let i = 0; i < args.length; i++){
                qqx += args[i]
                if(i != args.length - 1){
                    qqx += ", ";
                }
            }
            qqx += ")";
            return qqx;
        }
    }
    let i18n = require(`../i18n/${lang}.json`);
    if (typeof i18n[key] == "undefined") {
        i18n = require("../i18n/en.json");
        if (typeof i18n[key] == "undefined") {
            return key;
        }
    }
    /** @type string */
    let string = i18n[key];
    if (args.length > 0) {
        for (let i = 0; i < args.length; i++){
            string = string.replace(new RegExp(`\\$${i+1}`,"g"), args[i]);
        }
    }
    if (string.includes("{{PLURAL:")){
        let found = [...string.matchAll(/{{PLURAL:(\d+)\.?\d?\|(.*)}}/g)];
        found = found[0];
        //console.log(found);
        found[2] = found[2].split("|");
        if(found[2].length === 1){
            return string = string.replace(/{{PLURAL:\d+\.?\d?\|.*}}/, found[2][0]);
        }
        if(found[1] === "1"){
            return string = string.replace(/{{PLURAL:\d+\.?\d?\|.*}}/, found[2][0]);
        } else{
            return string = string.replace(/{{PLURAL:\d+\.?\d?\|.*}}/, found[2][1]);
        }
    }
    return string;
}