const log = require('../utils/log.js');
const roles = require('../roles.json');
const i18n = require('../i18n.js');

module.exports = class {
    /**
     * A role in the game
     * 
     * @constructor
     * @param {string} key - identifying key for the role
     * @param {string} lang - language code
     */
    constructor(key, lang) {
        this.key = key;
        this.lang = lang;
        if(typeof roles[key] === "undefined"){
            this.role = null;
            this.isValid = false;
        }else{
            this.role = roles[key];
            this.type = this.role.type;
            this.name = i18n(`role-${key}`, this.lang);
            this.desc = this.role.desc;
            delete this.role;
            this.isValid = true;
        }
    }
}