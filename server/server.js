module.exports = client => {
    const express = require("express");
    const bodyParser = require('body-parser');
    const app = express();
    const port = 49620;
    const log = require("../src/utils/log.js");

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static('./server/public'));

    app.get("/", (_, res) => {
        res.redirect('/index.html');
    });

    app.get('/client',(_, res) => {
        let guilds = Array.from(client.guilds.cache.keys());
        let response = "";
        response+=`<!DOCTYPE html><html><head><title>Discord</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><ul>`;
        for(let i=0;i<guilds.length;i++){
            response+=`<li><a href="/guild/${guilds[i]}">${client.guilds.cache.get(guilds[i]).name}</a></li>`;
        }
        response+="</ul></body></html>";
        res.send(response);
    });
    app.get('/app', (_, res) => {
        res.redirect('/client');
    });

    app.get('/guilds', (_, res) => {
        res.json(Array.from(client.guilds.cache.keys()));
    });

    app.get('/guild/:id',(req, res) => {
        let response = "";
        response+=`<!DOCTYPE html><html><head><title>Discord</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><p><a href="/client">&lt; Back</a></p>`;
        response+=`<h1>${client.guilds.cache.get(req.params.id).name}</h1><ul>`;
        let channels = client.guilds.cache.get(req.params.id).channels;
        let channelsArray = Array.from(channels.cache.keys());
        for(let i=0;i<channelsArray.length;i++){
          switch(channels.cache.get(channelsArray[i]).type){
            case 'voice':
            response+="";
            break;
            case 'category':
            response+=`<li>${channels.cache.get(channelsArray[i]).name}</li>`;
            break;
            default:
            response+=`<li><a href="/channel/${channelsArray[i]}">#${channels.cache.get(channelsArray[i]).name}</a></li>`;
            break;
          }
        }
        response+='</ul></body></html>';
        res.send(response)
    });

    app.get('/channel/:id',(req,res)=>{
        let response = "";
        let channel = client.channels.cache.get(req.params.id);
        const emojis = client.emojis.cache.array();
        response+=`<!DOCTYPE html><html><head><title>Discord</title><meta name="viewport" content="width=device-width, initial-scale=1"><link href="/fonts.css" rel="stylesheet"><link rel="stylesheet" href="/bundle.css"><style>body{font-family:Whitney,'Helvetica Neue',Helvetica,Arial,sans-serif}textarea{border:1px solid #040405;padding:10px;font-family: Whitney,Helvetica Neue,Helvetica,Arial,sans-serif;height:120px;outline:none;resize:none;background-color: #2f3136;border-radius: 3px;color: #f6f6f7;transition: background-color .15s ease,border .15s ease;}textarea:focus{border:1px solid #7289da;}.overline{font-size:12px;font-weight:600;line-height:16px;color:#b9bbbe;text-transform:uppercase;margin-top:8px;margin-bottom:8px;display:block;}`
        response+=`.flexbox{display:flex;}.flexbox>div{max-width:50%;}a{color:white;}</style></head>`;
        response+=`<body style="background:#36393f;color:white;margin-left:12px;"><p><a href="/guild/${channel.guild.id}">&lt; Back</a></p>`;

        if (channel.type === "text") {
            response+=`<h2>#${channel.name}</h2><div class="flexbox"><div><div><button onclick="toggleTyping();" class="btn-grey mdc-button mdc-button--unelevated"><div class="mdc-button__ripple"></div><span class="mdc-button__label">Toggle typing</span></button><span>Typing: <span>${channel.typing}</span></div>`
            response+=`<div><label for="message" class="overline">Message Text</label>`
            response+=`<textarea id="message" name="message" cols="100"></textarea>`;
            response+=`<h3 style="cursor:pointer;" onclick="document.getElementById('emojis').style.display='block'">Emojis</h3><p id="emojis" style="display:none;">`;
            for(let i=0;i<emojis.length;i++){
                response+=`<span id="n${emojis[i].id}" onclick="this.style.display='none';document.getElementById('e${emojis[i].id}').style.display='inline'">${emojis[i].name} </span><img src="${emojis[i].url}" id="e${emojis[i].id}" width="32" onclick="document.querySelector('textarea').value+='<${emojis[i].animated?"a":""}:${emojis[i].name}:${emojis[i].id}>';this.style.display='none';document.getElementById('n${emojis[i].id}').style.display='inline'" style="cursor:pointer;display:none;" />`;
            }
            response+=`</p><button class="btn-blue mdc-button mdc-button--unelevated" onclick="sendMsg();"><div class="mdc-button__ripple"></div><span class="mdc-button__label">Send</span></button></div></div>`;
            response+=`<div style="margin-left:16px;"><h3 class="overline">Messages</h3><ul id="mul"></ul></div>`;
            response+=`</div><script>const xhr=new XMLHttpRequest();xhr.onreadystatechange=function(){if(xhr.readyState===XMLHttpRequest.DONE){let response=JSON.parse(xhr.responseText);if(response.action=="send"){let a=document.createElement("a");a.appendChild(document.createTextNode("(edit)"));a.setAttribute("href","/channel/${req.params.id}/"+response.id+"/edit");let li=document.createElement("li");li.appendChild(document.createTextNode(response.id+" "));li.appendChild(a);document.getElementById("mul").appendChild(li);}}};function sendMsg(){xhr.open("POST",'/send-client',true);xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");xhr.send(\`id=${req.params.id}&msg=\${document.getElementById("message").value}\`);}function toggleTyping(){xhr.open("POST",'/toggle-typing',true);xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");xhr.send(\`id=${req.params.id}\`);}</script>`;
        } else {
            response+="This type of channel is not supported.";
        }
        response+="</body></html>";
        res.send(response);
    });

    app.post('/send-client',(req,res)=>{
        let response = {};
        let channel = client.channels.cache.get(req.body.id);
        if(channel.type!="text"){
          console.log("not text channel");
          response["error"] = "not-text-channel";
          res.status(400);
          res.json(response);
        }else{
          channel.send(req.body.msg).then(message => {
              response["id"] = message.id;
              response["success"] = "true";
              response["action"] = "send";
              response["content"] = req.body.msg;
              res.status(200);
              res.json(response);
          }).catch(console.error);
        }
    });
    app.post('/toggle-typing',(req,res)=>{
        let response={};
        let channel = client.channels.cache.get(req.body.id);
        if(channel.type!="text"){
          console.log("not text channel");
          response["error"] = "not-text-channel";
          res.status(400);
        }else{
          if(channel.typing){
            channel.stopTyping(true);
            response["success"] = "true";
            response["action"] = "stop-typing";
            response["force"] = "true";
          }else{
            channel.startTyping();
            response["success"] = "true";
            response["action"] = "start-typing";
          }
        }
        res.json(response);
    });

    app.get('/emojis', (_, res) => {
        res.json(Array.from(client.emojis.cache.keys()));
    });

    app.get('/channel/:cid/:mid/edit', (req, res) => {
        client.channels.fetch(req.params.cid).then(channel => {
            channel.messages.fetch(req.params.mid).then(message => {
                const content = message.content;
                let response = "";
                response+=`<!DOCTYPE html><html><head><title>Discord</title><meta name="viewport" content="width=device-width, initial-scale=1"><link href="/fonts.css" rel="stylesheet"><link rel="stylesheet" href="/bundle.css"><style>body{font-family:Whitney,'Helvetica Neue',Helvetica,Arial,sans-serif}textarea{border:1px solid #040405;padding:10px;}textarea:focus{border:1px solid #7289da;}`
                response+=`.flexbox{display:flex;}</style></head>`;
                response+=`<body style="background:#36393f;color:white;margin-left:12px;"><p><a href="/channel/${req.params.cid}" style="color:white">&lt; Back</a></p><h2>#${channel.name}</h2>`;
                if (channel.type === "text") {
                    response+=`<div><label for="message" style="font-size:12px;font-weight:600;line-height:16px;color:#b9bbbe;text-transform:uppercase;margin-top:8px;margin-bottom:8px;display:block;">New Message Text</label>`
                    response+=`<textarea id="message" name="message" cols="100" style="font-family: Whitney,Helvetica Neue,Helvetica,Arial,sans-serif;height:120px;outline:none;resize:none;background-color: #2f3136;border-radius: 3px;color: #f6f6f7;transition: background-color .15s ease,border .15s ease;">${content}</textarea>`;
                    /*response+=`<h3 style="cursor:pointer;" onclick="document.getElementById('emojis').style.display='block'">Emojis</h3><p id="emojis" style="display:none;">`;
                    for(let i=0;i<emojis.length;i++){
                        response+=`<span id="n${emojis[i].id}" onclick="this.style.display='none';document.getElementById('e${emojis[i].id}').style.display='inline'">${emojis[i].name} </span><img src="${emojis[i].url}" id="e${emojis[i].id}" width="32" onclick="document.querySelector('textarea').value+='<${emojis[i].animated?"a":""}:${emojis[i].name}:${emojis[i].id}>';this.style.display='none';document.getElementById('n${emojis[i].id}').style.display='inline'" style="cursor:pointer;display:none;" />`;
                    }
                    response+=`</p>`;*/
                    response+=`<br /><br /><button class="btn-blue mdc-button mdc-button--unelevated" onclick="sendMsg();"><div class="mdc-button__ripple"></div><span class="mdc-button__label">Send</span></button></div>`;
                    response+=`<script>const xhr=new XMLHttpRequest();function sendMsg(){xhr.open("POST",'/edit',true);xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");xhr.send(\`cid=${req.params.cid}&mid=${req.params.mid}&msg=\${document.getElementById("message").value}\`);}</script>`;
                } else {
                    response+="This type of channel is not supported.";
                }
                response+=`</body></html>`;
                res.send(response);
                
            }).catch(console.error);
        }).catch(console.error);
    });

    app.post('/edit', (req, res) => {
        let response = {};
        let channel = client.channels.cache.get(req.body.cid);
        if(channel.type!="text"){
            console.log("not text channel");
            response["error"] = "not-text-channel";
            res.status(400);
        }else{
            channel.messages.fetch(req.body.mid).then(message => {
                message.edit(req.body.msg);
            }).catch(e=>{console.error(e); res.status(500);});
            response["success"] = "true";
            response["content"] = req.body.msg;
            res.status(200);
        }
        res.json(response);
    });

    app.get('/channel/:cid/:mid', (req, res) => {
        client.channels.fetch(req.params.cid).then(channel => {
            channel.messages.fetch(req.params.mid).then(message => {
                res.send(message.content);
            }).catch(console.error);
        }).catch(console.error);
    });

    app.listen(port, _ => {
        log(`Server listening at http://localhost:${port}`);
    });
}