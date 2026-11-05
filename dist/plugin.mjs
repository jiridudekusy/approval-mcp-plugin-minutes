//#region src/plugin.ts
const MINUTES_PLUGIN_ID = "minutes";
const MINUTES_PLUGIN_VERSION = "1.0.0";
function unknownRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function nonempty(value) {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
}
function resolvedMessage(result, messageId) {
	const pending = [result];
	let inspected = 0;
	while (pending.length > 0 && inspected < 100) {
		const value = pending.shift();
		inspected += 1;
		if (Array.isArray(value)) {
			pending.push(...value.slice(0, 100));
			continue;
		}
		const item = unknownRecord(value);
		if (item === void 0) continue;
		const id = nonempty(item["messageId"] ?? item["id"]);
		if (id === messageId) {
			const text = nonempty(item["text"] ?? item["body"] ?? item["content"]);
			const conversationId = nonempty(item["conversationId"] ?? item["chatId"] ?? item["groupId"]);
			return {
				id,
				...text === void 0 ? {} : { text },
				...conversationId === void 0 ? {} : { conversationId }
			};
		}
		for (const key of [
			"structuredContent",
			"content",
			"message",
			"messages",
			"result",
			"data"
		]) if (item[key] !== void 0) pending.push(item[key]);
		const text = nonempty(item["text"]);
		if (text !== void 0 && (text.startsWith("{") || text.startsWith("["))) try {
			pending.push(JSON.parse(text));
		} catch {}
	}
}
function message(key, en, cs, params) {
	return {
		key,
		...params === void 0 ? {} : { params },
		fallback: {
			en,
			cs
		}
	};
}
function field(key, en, cs, value) {
	return {
		label: message(key, en, cs),
		value
	};
}
function record(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function stringValue(input, key) {
	const value = input[key];
	return typeof value === "string" && value.length > 0 ? value : void 0;
}
const additionalLabels = {
	cursor: {
		en: "Continuation cursor",
		cs: "Pokračovací kurzor"
	},
	limit: {
		en: "Limit",
		cs: "Limit"
	},
	offset: {
		en: "Offset",
		cs: "Posun"
	},
	page: {
		en: "Page",
		cs: "Stránka"
	},
	from: {
		en: "From",
		cs: "Od"
	},
	to: {
		en: "To",
		cs: "Do"
	},
	order: {
		en: "Sort order",
		cs: "Řazení"
	},
	direction: {
		en: "Direction",
		cs: "Směr"
	}
};
function readableKey(key) {
	return key.replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
}
function shownByCuratedFields(key, value, args, toolName) {
	if ([
		"conversationId",
		"groupId",
		"contactId",
		"recordingId"
	].includes(key)) return stringValue(args, "messageId") === void 0 && typeof value === "string" && value.length > 0;
	if (key === "messageId" || [
		"text",
		"query",
		"title"
	].includes(key)) return typeof value === "string" && value.length > 0;
	if ([
		"phoneNumber",
		"username",
		"attachmentId",
		"description"
	].includes(key)) return typeof value === "string";
	if (key === "emoji") return typeof value === "string" || value === null;
	if (key === "memberIds") return Array.isArray(value);
	if (key === "withVideo") return toolName === "start_call" && typeof value === "boolean";
	return [
		"editDetails",
		"addMembers",
		"inviteLink",
		"announcementsOnly",
		"seconds",
		"disappearingMessagesSeconds",
		"avatarPath"
	].includes(key);
}
function entityValue(entity) {
	return {
		id: entity.id,
		name: entity.name
	};
}
function entityName(entity, fallback) {
	return entity.name ?? `${fallback} · ${entity.id}`;
}
function scope(id, path, value, target, kind, durations) {
	const labels = {
		contact: {
			en: "Contact: {target}",
			cs: "Kontakt: {target}"
		},
		conversation: {
			en: "Conversation: {target}",
			cs: "Konverzace: {target}"
		},
		group: {
			en: "Group: {target}",
			cs: "Skupina: {target}"
		},
		message: {
			en: "Message: {target}",
			cs: "Zpráva: {target}"
		},
		recording: {
			en: "Recording: {target}",
			cs: "Nahrávka: {target}"
		}
	};
	return {
		id,
		label: message(`minutes.scope.${kind}`, labels[kind].en, labels[kind].cs, { target }),
		predicates: [{
			path,
			operator: "equals",
			value
		}],
		durations
	};
}
const toolTitles = {
	add_contact: {
		en: "Add a Signal contact",
		cs: "Přidat kontakt Signalu"
	},
	download_attachment: {
		en: "Download a Signal attachment",
		cs: "Stáhnout přílohu Signalu"
	},
	get_attachment_directories: {
		en: "Show attachment directories",
		cs: "Zobrazit složky příloh"
	},
	get_server_status: {
		en: "Check Minutes server status",
		cs: "Zjistit stav serveru Minutes"
	},
	list_recordings: {
		en: "List recordings",
		cs: "Vypsat nahrávky"
	},
	search_recordings: {
		en: "Search recordings",
		cs: "Hledat v nahrávkách"
	},
	get_recording: {
		en: "Open a recording",
		cs: "Načíst nahrávku"
	},
	transcribe_recording: {
		en: "Transcribe a recording",
		cs: "Přepsat nahrávku"
	},
	summarize_recording: {
		en: "Summarize a recording",
		cs: "Shrnout nahrávku"
	},
	list_conversations: {
		en: "List Signal conversations",
		cs: "Vypsat konverzace Signalu"
	},
	list_contacts: {
		en: "List Signal contacts",
		cs: "Vypsat kontakty Signalu"
	},
	get_messages: {
		en: "Read messages",
		cs: "Načíst zprávy"
	},
	get_message: {
		en: "Read a message",
		cs: "Načíst zprávu"
	},
	search_messages: {
		en: "Search messages",
		cs: "Hledat ve zprávách"
	},
	send_message: {
		en: "Send a Signal message",
		cs: "Odeslat zprávu přes Signal"
	},
	set_message_reaction: {
		en: "Change a message reaction",
		cs: "Změnit reakci na zprávu"
	},
	get_group: {
		en: "Open a Signal group",
		cs: "Načíst skupinu Signalu"
	},
	find_groups_by_member: {
		en: "Find groups by member",
		cs: "Hledat skupiny podle člena"
	},
	create_group: {
		en: "Create a Signal group",
		cs: "Vytvořit skupinu Signalu"
	},
	update_group_metadata: {
		en: "Update group details",
		cs: "Upravit údaje skupiny"
	},
	add_group_members: {
		en: "Add group members",
		cs: "Přidat členy skupiny"
	},
	remove_group_members: {
		en: "Remove group members",
		cs: "Odebrat členy skupiny"
	},
	set_group_member_roles: {
		en: "Change group member roles",
		cs: "Změnit role členů skupiny"
	},
	set_group_permissions: {
		en: "Change group permissions",
		cs: "Změnit oprávnění skupiny"
	},
	set_group_disappearing_messages: {
		en: "Change disappearing messages",
		cs: "Změnit mizející zprávy"
	},
	leave_group: {
		en: "Leave a Signal group",
		cs: "Opustit skupinu Signalu"
	},
	terminate_group: {
		en: "Permanently terminate a Signal group",
		cs: "Trvale ukončit skupinu Signalu"
	},
	get_active_call: {
		en: "Check the active call",
		cs: "Zjistit aktivní hovor"
	},
	start_call: {
		en: "Start a Signal call",
		cs: "Zahájit hovor přes Signal"
	},
	hang_up_call: {
		en: "End the active call",
		cs: "Ukončit aktivní hovor"
	},
	start_audio_recording: {
		en: "Start audio recording",
		cs: "Spustit audio nahrávání"
	},
	start_video_recording: {
		en: "Start video recording",
		cs: "Spustit video nahrávání"
	},
	pause_recording: {
		en: "Pause recording",
		cs: "Pozastavit nahrávání"
	},
	resume_recording: {
		en: "Resume recording",
		cs: "Pokračovat v nahrávání"
	},
	stop_recording: {
		en: "Stop and save recording",
		cs: "Ukončit a uložit nahrávání"
	}
};
const dangerTools = /* @__PURE__ */ new Set([
	"hang_up_call",
	"leave_group",
	"remove_group_members",
	"set_group_member_roles",
	"set_group_permissions",
	"set_group_disappearing_messages",
	"stop_recording",
	"terminate_group"
]);
const warningTools = /* @__PURE__ */ new Set([
	"add_contact",
	"add_group_members",
	"create_group",
	"download_attachment",
	"send_message",
	"set_message_reaction",
	"start_audio_recording",
	"start_call",
	"start_video_recording",
	"summarize_recording",
	"transcribe_recording",
	"update_group_metadata"
]);
function riskFor(toolName) {
	if (dangerTools.has(toolName)) return "danger";
	if (warningTools.has(toolName)) return "warning";
	return "info";
}
var MinutesApprovalPlugin = class {
	resources;
	id = MINUTES_PLUGIN_ID;
	version = MINUTES_PLUGIN_VERSION;
	normalizationVersion = 2;
	constructor(resources) {
		this.resources = resources;
	}
	async describe(input) {
		const args = record(input.arguments);
		const title = toolTitles[input.toolName] ?? {
			en: `Minutes: ${input.toolName}`,
			cs: `Minutes: ${input.toolName}`
		};
		const fields = [];
		const proposedScopes = [];
		const normalizedContext = structuredClone(args);
		const target = await this.#describeTarget(input, args, fields, proposedScopes, normalizedContext) ?? stringValue(args, "title") ?? stringValue(args, "query");
		await this.#describeMembers(input, args, fields);
		this.#describeArguments(input.toolName, args, fields);
		for (const [key, value] of Object.entries(args).sort(([left], [right]) => left.localeCompare(right))) {
			if (shownByCuratedFields(key, value, args, input.toolName)) continue;
			const label = stringValue(args, "messageId") !== void 0 && [
				"conversationId",
				"groupId",
				"contactId",
				"recordingId"
			].includes(key) ? {
				en: `Caller-supplied ${readableKey(key)} (unverified)`,
				cs: `Zadané ${readableKey(key)} (neověřeno)`
			} : additionalLabels[key];
			const readable = readableKey(key);
			fields.push(field(`minutes.field.additional.${key}`, label?.en ?? readable, label?.cs ?? readable, structuredClone(value)));
		}
		const sections = [{
			id: "request",
			heading: message("minutes.section.request", "Requested operation", "Požadovaná operace"),
			fields,
			risk: riskFor(input.toolName)
		}];
		if (Object.keys(args).length > 0) sections.push({
			id: "technical",
			heading: message("minutes.section.technical", "Technical details", "Technické detaily"),
			fields: [field("minutes.field.arguments", "Arguments", "Argumenty", structuredClone(args))],
			risk: "info"
		});
		return {
			source: "plugin",
			normalizedContext,
			sensitivePaths: [],
			title: message(`minutes.tool.${input.toolName}`, target === void 0 ? title.en : `${title.en}: {target}`, target === void 0 ? title.cs : `${title.cs}: {target}`, target === void 0 ? void 0 : { target }),
			sections,
			proposedScopes
		};
	}
	async #describeTarget(input, args, fields, scopes, normalizedContext) {
		let target;
		const messageId = stringValue(args, "messageId");
		let resolved;
		if (messageId !== void 0 && this.resources?.readMessage !== void 0) try {
			resolved = resolvedMessage(await this.resources.readMessage(input.upstreamId, messageId), messageId);
		} catch {}
		const conversationId = messageId === void 0 ? stringValue(args, "conversationId") : resolved?.conversationId;
		if (messageId !== void 0) {
			delete normalizedContext["conversationId"];
			delete normalizedContext["groupId"];
			delete normalizedContext["contactId"];
			delete normalizedContext["recordingId"];
		}
		if (conversationId !== void 0) {
			const conversation = await this.#entity(input, "conversations", conversationId, "title");
			fields.push(field("minutes.field.conversation", "Conversation", "Konverzace", entityValue(conversation)));
			target = entityName(conversation, "Conversation");
			normalizedContext["conversationId"] = conversationId;
			scopes.push(scope("conversation", "/conversationId", conversationId, entityName(conversation, "Conversation"), "conversation", ["hour", "forever"]));
		}
		const groupId = messageId === void 0 ? stringValue(args, "groupId") : void 0;
		if (groupId !== void 0) {
			const group = await this.#entity(input, "conversations", groupId, "title");
			fields.push(field("minutes.field.group", "Group", "Skupina", entityValue(group)));
			target ??= entityName(group, "Group");
			const destructive = dangerTools.has(input.toolName);
			if (input.toolName !== "leave_group" && input.toolName !== "terminate_group") scopes.push(scope("group", "/groupId", groupId, entityName(group, "Group"), "group", destructive ? ["hour"] : ["hour", "forever"]));
		}
		const contactId = messageId === void 0 ? stringValue(args, "contactId") : void 0;
		if (contactId !== void 0) {
			const contact = await this.#entity(input, "contacts", contactId, "title");
			fields.push(field("minutes.field.contact", "Contact", "Kontakt", entityValue(contact)));
			target ??= entityName(contact, "Contact");
			scopes.push(scope("contact", "/contactId", contactId, entityName(contact, "Contact"), "contact", ["hour", "forever"]));
		}
		const recordingId = messageId === void 0 ? stringValue(args, "recordingId") : void 0;
		if (recordingId !== void 0) {
			const recording = await this.#entity(input, "recordings", recordingId, "conversationTitle");
			fields.push(field("minutes.field.recording", "Recording", "Nahrávka", entityValue(recording)));
			target ??= entityName(recording, "Recording");
			scopes.push(scope("recording", "/recordingId", recordingId, entityName(recording, "Recording"), "recording", ["hour", "forever"]));
		}
		if (messageId !== void 0) {
			if (resolved?.text !== void 0) fields.push(field("minutes.field.messageText", "Message text", "Text zprávy", resolved.text));
			fields.push(field("minutes.field.message", "Message ID", "ID zprávy", messageId));
			target ??= `ID ${messageId}`;
		}
		return target;
	}
	#describeArguments(toolName, args, fields) {
		const text = stringValue(args, "text");
		if (text !== void 0) fields.push(field("minutes.field.text", "Message text", "Text zprávy", text));
		const query = stringValue(args, "query");
		if (query !== void 0) fields.push(field("minutes.field.query", "Search query", "Hledaný text", query));
		const title = stringValue(args, "title");
		if (title !== void 0) fields.push(field("minutes.field.title", "Title", "Název", title));
		for (const [key, label] of Object.entries({
			phoneNumber: {
				en: "Phone number",
				cs: "Telefonní číslo"
			},
			username: {
				en: "Username",
				cs: "Uživatelské jméno"
			},
			attachmentId: {
				en: "Attachment ID",
				cs: "ID přílohy"
			}
		})) {
			const value = args[key];
			if (typeof value === "string") fields.push(field(`minutes.field.${key}`, label.en, label.cs, value));
		}
		const description = args["description"];
		if (typeof description === "string") fields.push(field("minutes.field.description", "Description", "Popis", description));
		const emoji = args["emoji"];
		if (typeof emoji === "string" || emoji === null) fields.push(field("minutes.field.reaction", "Reaction", "Reakce", emoji ?? "∅"));
		if (toolName === "start_call") fields.push(field("minutes.field.callType", "Call type", "Typ hovoru", args["withVideo"] === true ? "video" : "audio"));
		for (const [key, label] of Object.entries({
			editDetails: {
				en: "Who may edit group details",
				cs: "Kdo může upravovat údaje skupiny"
			},
			addMembers: {
				en: "Who may add members",
				cs: "Kdo může přidávat členy"
			},
			inviteLink: {
				en: "Invite link mode",
				cs: "Režim pozvánkového odkazu"
			},
			announcementsOnly: {
				en: "Announcements only",
				cs: "Pouze oznámení"
			},
			seconds: {
				en: "Duration in seconds",
				cs: "Doba v sekundách"
			},
			disappearingMessagesSeconds: {
				en: "Disappearing messages",
				cs: "Mizející zprávy"
			},
			avatarPath: {
				en: "Avatar file",
				cs: "Soubor avataru"
			}
		})) {
			const value = args[key];
			if (value !== void 0) fields.push(field(`minutes.field.${key}`, label.en, label.cs, structuredClone(value)));
		}
	}
	async #describeMembers(input, args, fields) {
		const memberIds = args["memberIds"];
		if (Array.isArray(memberIds)) {
			const members = await Promise.all(memberIds.map(async (value, index) => {
				if (typeof value !== "string") return value;
				if (index >= 100) return entityValue({
					id: value,
					name: null
				});
				return entityValue(await this.#entity(input, "contacts", value, "title"));
			}));
			fields.push(field("minutes.field.members", "Members", "Členové", members));
		}
		const roles = args["roles"];
		if (Array.isArray(roles)) {
			const resolvedRoles = await Promise.all(roles.map(async (value, index) => {
				const role = record(value);
				const memberId = stringValue(role, "memberId");
				if (memberId === void 0) return structuredClone(value);
				const member = index >= 100 ? {
					id: memberId,
					name: null
				} : await this.#entity(input, "contacts", memberId, "title");
				return {
					id: member.id,
					name: member.name,
					role: typeof role["role"] === "string" ? role["role"] : "member"
				};
			}));
			fields.push(field("minutes.field.roles", "Member roles", "Role členů", resolvedRoles));
		}
	}
	async #entity(input, resource, id, nameKey) {
		if (this.resources === void 0) return {
			id,
			name: null
		};
		try {
			const name = record(await this.resources.readJson(input.upstreamId, `minutes://${resource}/${encodeURIComponent(id)}`) ?? {})[nameKey];
			return {
				id,
				name: typeof name === "string" ? name : null
			};
		} catch {
			return {
				id,
				name: null
			};
		}
	}
};
//#endregion
//#region src/index.ts
function createPlugin(host) {
	return new MinutesApprovalPlugin(host);
}
//#endregion
export { createPlugin };
