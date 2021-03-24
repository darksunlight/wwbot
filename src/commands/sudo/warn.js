const log = require('../../utils/log.js');
const warn = require('../../utils/warn.js');
module.exports = {
    name: 'warn',
    execute(message, args) {
        warn("hello");
    },
};
