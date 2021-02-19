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

    app.get('/client',(req,res)=>{
        let guilds = Array.from(client.guilds.cache.keys());
        let response = "";
        response+=`<!DOCTYPE html><html><head><title>Discord</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><ul>`;
        for(let i=0;i<guilds.length;i++){
          response+=`<li><a href="/guild/${guilds[i]}">${client.guilds.cache.get(guilds[i]).name}</a></li>`;
        }
        response+="</ul></body></html>";
        res.send(response);
    });
    app.get('/app', (_, res)=>{
        res.redirect('/client');
    });

    app.get('/guilds', (_,res) => {
        res.json(Array.from(client.guilds.cache.keys()));
    });

    app.get('/guild/:id',(req,res)=>{
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
    //console.log(emojis);
    response+=`<!DOCTYPE html><html><head><title>Discord</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="background:#2f3136;color:white;"><p><a href="javascript:window.history.back()">&lt; Back</a></p>`;
    switch(channel.type){
      case 'text':
        //console.log(Array.from(channel.messages.keys()));
        response+=`<h1>#${channel.name}</h1>`;
        response+=`<div><button onclick="toggleTyping();">Toggle typing</button><span>Typing: <span>${channel.typing}</span></div>`
        response+=`<div><label for="message">Message Text</label><br><textarea id="message" name="message" rows="25" cols="100"></textarea>`;
        response+=`<h3>Emojis</h3><p>`;
        for(let i=0;i<emojis.length;i++){
            response+=`<img src="${emojis[i].url}" width="32" onclick="document.querySelector('textarea').value+='<${emojis[i].animated?"a":""}:${emojis[i].name}:${emojis[i].id}>'" style="cursor:pointer" />`;
            // console.log(emojis[i].url);
        }
        response+=`</p><!--
              --><button onclick="sendMsg();">Send</button></div>`;
        response+=`<script>
        const channelId = "${req.params.id}";
  const xhr = new XMLHttpRequest();
  function sendMsg(){
  xhr.open("POST", '/send-client', true);
  
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  
  xhr.onreadystatechange = function() { // Call a function when the state changes.
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          console.log(this.response);
      }
  }
  xhr.send(\`id=${req.params.id}&msg=\${document.getElementById("message").value}\`);}
  function toggleTyping(){
    xhr.open("POST", '/toggle-typing', true);
  
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  
    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log(this.response);
        }
    }
    xhr.send(\`id=${req.params.id}\`);
  }</script>`;
  
      break;
      default:
      response+="This type of channel is not supported.";
      break;
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
        }else{
          channel.send(req.body.msg);
          response["success"] = "true";
          response["content"] = req.body.msg;
          res.status(200);
        }
        res.json(response);
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

    app.get('/emojis', (_,res)=>{
        res.json(Array.from(client.emojis.cache.keys()));
    });

    app.listen(port, _ => {
        log(`Server listening at http://localhost:${port}`);
    });
}