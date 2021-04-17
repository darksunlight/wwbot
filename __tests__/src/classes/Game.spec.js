const Game = require("../../../src/classes/Game.js");
const Discord = require("discord.js");

jest.mock("discord.js");

describe("Game object", () => {
    test("creating new Game", () => {
        const client = new Discord.Client();
        client.login();
        //console.log(client);
    });
});