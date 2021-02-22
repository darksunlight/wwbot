const Code = require('../classes/Code.js');
module.exports = {
    name: 'test',
    su: true,
    cooldown: 0.1,
    description: '',
    execute(message, args) {
        try{
            const code = new Code(message.client, args[0]||"");
            if(code.isValid()){
                message.channel.send(`The code ${code.code} is valid.`);
            }else{
                message.channel.send(`The code ${code.code} is invalid.`);
            }
        }catch(e){
            console.error(e.message);
        }
    },
};
