const Role = require('./Role.js');
//const InvalidRoleCodeException = require('./exceptions/InvalidRoleCodeException.js');
const Discord = require('discord.js');
const log = require('../utils/log.js');
const shuffleArray = require('../utils/shuffleArray.js');
const codes = require('../codes.json');

module.exports = class {
    /**
     * Represents a role code
     * @constructor
     * @param {Discord.Client} client - Bot client
     * @param {string} code - Role code
     */
    constructor(client, code) {
        this.client = client;
        this.code = code;
        this.ended = false;
    }
    /**
     * @returns {Role[]} roles
     */
    get roles() {
        if(!this.isValid()){
            return [];
        }
        let rawRoles = codes[this.code];
        rawRoles = rawRoles.split(',');
        let roles = [];
        rawRoles.forEach(rawRole => roles.push(new Role(rawRole)));
        roles = shuffleArray(roles);
        return roles;
    }
    /**
     * @returns {boolean} whether the given code is valid
     */
    isValid(...code) {
        if(code.length===0){
            if(typeof codes[this.code]==="undefined"){
                //throw new InvalidRoleCodeException("invalid-code");
                return false;
            }else{
                return true;
            }
        }else if(code.length===1){
            if(typeof codes[code[0]]==="undefined"){
                return false;
            }else{
                return true;
            }
        }else{
            throw "Incorrect Code.isValid usage.";
        }
    }
}