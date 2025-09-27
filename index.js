const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
  ],
});

const TOKEN = "MTQyMTU4MDQzNTgyNTA5ODc5Mw.GltH46.UbJYP6r1ugEAtyL38yKLaiuGup5bs8vHYsJAg8"; // Pon tu token real aquí
const LOG_CHANNEL_ID = "1421354318832865302"; // Canal de notificaciones
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
client.on("error", (error) => console.error("Error del bot:", error));
client.on("disconnect", (event) => console.log("Bot desconectado:", event));
client.on("reconnecting", () => console.log("Bot reconectando..."));
client.on("warn", (info) => console.log("Advertencia:", info));

// ===== Función de asignar rol y notificar en canal =====
async function assignRole(inviter, count, guild) {
  try {
    const roleConfig = ROLES.find(r => r.count === count);
    if (!roleConfig) return;

    const role = guild.roles.cache.get(roleConfig.roleId);
    const user = guild.members.cache.get(inviter.id);
    if (!role || !user) return;

    await user.roles.add(role);
    console.log(`🎉 ${inviter.tag} alcanzó ${count} invitaciones y recibió el rol ${role.name}`);

    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      logChannel.send(`🎉 ¡Felicidades ${inviter}! Alcanzaste ${count} invitaciones y obtuviste el rol **${role.name}**.`);
    }
  } catch (error) {
    console.error("Error al asignar rol:", error);
  }
}

// ===== Evento listo =====
client.once("ready", async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
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
    console.error("Error en guildMemberAdd:", error);
  }
});

// ===== Iniciar bot =====
client.login(TOKEN);
