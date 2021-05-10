const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => res.send("Oh hey, what are you doing here? "));

app.listen(port, () =>
	console.log(`Embed Bot listening at http://localhost:${port}`)
);

// ================= START BOT CODE =================== //

const Discord = require("discord.js");
const client = new Discord.Client();
const DBL = require("dblapi.js");
const dbl = new DBL(process.env.DBL_TOKEN, client);

const emitError = (error) => client.emit("error", error);
const deprecationNotice = new Discord.MessageEmbed({
	title: "Embed Bot has been deprecated!",
	description:
		"Embed Bot is no longer being maintained. If you are looking for a replacement to Embed Bot, you can find its predecessor here: https://github.com/v-briese/botler",
	color: Discord.Constants.Colors.RED,
});

client.on("error", async (error) => {
	(await client.channels.fetch(process.env.ERROR_CHANNEL)).send(
		`\`\`\`js\n${error}\`\`\``
	);
	console.error(error);
});

client.once("ready", () => {
	console.log("Embed Bot is online!");
	client.user.setActivity("@Mention for cmds!", { type: "WATCHING" });

	setInterval(() => {
		const fetch = require("node-fetch");
		fetch(`https://discord.bots.gg/api/v1/bots/${client.user.id}/stats`, {
			method: "POST",
			headers: {
				Authorization: process.env.DISCORD_BOTS_GG_TOKEN,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ guildCount: client.guilds.cache.size }),
		});
	}, 60000);
});

client.on("message", (message) => {
	if (
		message.content == `<@${client.user.id}>` ||
		message.content == `<@!${client.user.id}>`
	)
		message.channel.send(deprecationNotice);
});

const registerCommand = (data) => {
	client.api
		.applications(process.env.CLIENT_ID)
		.commands.post({ data });
};

registerCommand({
	name: "embed",
	description: "Allows you to create an embed!",
	options: [
		{
			name: "title",
			description: "The title of your embed.",
			type: 3,
		},
		{
			name: "description",
			description: "The description of your embed.",
			type: 3,
		},
		{
			name: "url",
			description: "The url of your embed.",
			type: 3,
		},
		{
			name: "color",
			description: "The color of your embed.",
			type: 3,
		},
		{
			name: "footer",
			description: "The footer of your embed.",
			type: 3,
		},
		{
			name: "image",
			description: "The image of your embed.",
			type: 3,
		},
		{
			name: "thumbnail",
			description: "The thumbnail of your embed.",
			type: 3,
		},
	],
});
registerCommand({
	name: "invite",
	description: "Invite Embed Bot to your own server!",
});
registerCommand({
	name: "vote",
	description: "Vote for Embed Bot on top.gg!",
});
registerCommand({
	name: "support",
	description: "Get an invite to the support server.",
});

client.ws.on("INTERACTION_CREATE", async (interaction) => {
	const interact = (data) =>
		client.api.interactions(interaction.id, interaction.token).callback.post({
			data,
		});

	process.on("unhandledRejection", async (error) => {
		console.error(error);
		if (error.name == "DiscordAPIError") {
			try {
				(await client.channels.fetch(interaction.channel_id)).send(
					new Discord.MessageEmbed({
						title: "An error has occured!",
						description:
							"Hmm... It seems there was a problem with the parameters you gave.\n\nIf this message was *not* the result of invalid parameters, don't worry, the error has been automatically logged. We'll work on fixing this as soon as we see it.",
						thumbnail: {
							url: "https://i.imgur.com/J4jZEVD.png",
						},
						color: Discord.Constants.Colors.RED,
					})
				);
			} catch {}
		}
	});

	(await client.channels.fetch(process.env.LOG_CHANNEL)).send(
		`${(await client.users.fetch(interaction.member.user.id)).tag} (${
			interaction.member.user.id
		}) triggered the "${interaction.data.name}" (${
			interaction.data.id
		}) command.`
	);

	try {
		interact({
			type: 4,
			data: {
				embeds: [deprecationNotice],
			},
		});

		(await client.channels.fetch(process.env.LOG_CHANNEL)).send(
			`"${interaction.data.name}" (${interaction.data.id}) command ran succesfully.`
		);
	} catch (error) {
		emitError(error);

		(await client.channels.fetch(process.env.LOG_CHANNEL)).send(
			`"${interaction.data.name}" (${interaction.data.id}) command ran unsuccesfully. Check <#${process.env.ERROR_CHANNEL}> for more info.`
		);

		interact({
			type: 4,
			data: {
				content: "",
				embeds: [
					{
						title: "An error has occured!",
						description:
							"We're so sorry for the inconvenience!\n\nThe error has been automatically logged, so we'll start working on fixing this as soon as we see the message.",
						thumbnail: {
							url: "https://i.imgur.com/J4jZEVD.png",
						},
						color: Discord.Constants.Colors.RED,
					},
				],
			},
		});
	}
});

client.login(process.env.DISCORD_TOKEN);
