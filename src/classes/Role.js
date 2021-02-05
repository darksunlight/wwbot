const log = require('../utils/log.js');
const roles = require('../roles.json');

module.exports = class {
    /**
     * A role in the game
     * 
     * @constructor
     * @param {string} key - identifying key for the role
     */
    constructor(key) {
        this.key = key;
        if(typeof roles[key] === "undefined"){
            this.role = null;
            this.isValid = false;
        }else{
            this.role = roles[key];
            this.type = this.role.type;
            this.name = this.role.name;
            this.desc = this.role.desc;
            delete this.role;
            this.isValid = true;
        }
    }
}