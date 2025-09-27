require('dotenv').config(); // Cargar variables del .env
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
  ],
});

// Usar variables de entorno en lugar de poner token y canal directo
const TOKEN = process.env.BOT_TOKEN;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const ROLES = [
  { count: 3, roleId: "1421357901259477032" },
  { count: 10, roleId: "1421358012765044827" },
  { count: 25, roleId: "1421358054808485970" },
  { count: 40, roleId: "1421358217317060639" },
  { count: 50, roleId: "1421358266407063583" },
];

let invitesCache = new Map();
let userInvites = new Map();

// ===== Manejo de errores y reconexiones =====
client.on("error", (error) => console.error("Bot error:", error));
client.on("disconnect", (event) => console.log("Bot disconnected:", event));
client.on("reconnecting", () => console.log("Bot reconnecting..."));
client.on("warn", (info) => console.log("Warning:", info));

// ===== Función de asignar rol y notificar =====
async function assignRole(inviter, count, guild) {
  try {
    const roleConfig = ROLES.find(r => r.count === count);
    if (!roleConfig) return;

    const role = guild.roles.cache.get(roleConfig.roleId);
    const user = guild.members.cache.get(inviter.id);
    if (!role || !user) return;

    await user.roles.add(role);
    console.log(`🎉 ${inviter.tag} reached ${count} invites and received the role ${role.name}`);

    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      logChannel.send(`🎉 Congratulations ${inviter}! You reached ${count} invites and got the role **${role.name}**.`);
    }
  } catch (error) {
    console.error("Error assigning role:", error);
  }
}

// ===== Evento ready =====
client.once("ready", async () => {
  console.log(`✅ Bot connected as ${client.user.tag}`);
  const guild = client.guilds.cache.first();
  if (guild) {
    const invites = await guild.invites.fetch();
    invitesCache = new Map(invites.map((invite) => [invite.code, invite.uses]));
  }
});

// ===== Evento miembro nuevo =====
client.on("guildMemberAdd", async (member) => {
  try {
    const guild = member.guild;
    const newInvites = await guild.invites.fetch();
    const oldInvites = invitesCache;

    const inviteUsed = newInvites.find(
      (inv) => inv.uses > (oldInvites.get(inv.code) || 0)
    );

    invitesCache = new Map(newInvites.map((inv) => [inv.code, inv.uses]));
    if (!inviteUsed) return;

    const inviter = inviteUsed.inviter;
    if (!inviter) return;

    let count = (userInvites.get(inviter.id) || 0) + 1;
    userInvites.set(inviter.id, count);

    await assignRole(inviter, count, guild);
  } catch (error) {
    console.error("Error in guildMemberAdd:", error);
  }
});

// ===== Iniciar bot =====
client.login(TOKEN);
