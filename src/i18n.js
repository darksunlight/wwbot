/**
 * 
 * @param {string} key - i18n string identifying key
 * @param {string} lang - ISO639 code
 */
module.exports = (key, lang) => {
    const i18n = require(`../i18n/${lang}.json`);
    return i18n[key];
}