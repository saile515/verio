import { json, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

// export const sessions = pgTable("sessions", {
//     id: uuid().primaryKey().defaultRandom(),
//     created: timestamp().defaultNow(),
//     expires: timestamp().notNull(),
//     code: varchar({ length: 32 }).notNull(),
//     locked: boolean().notNull().default(false),
//     memo: text(),
// });
//
// export const events = pgTable("messages", {
//     id: uuid().primaryKey().defaultRandom(),
//     sessionId: uuid().notNull(),
//     created: timestamp().defaultNow(),
//     data: json(),
// });
//
// export const sessionEventRelations = defineRelations(
//     { sessions, events },
//     (relation) => ({
//         events: {
//             session: relation.one.sessions({
//                 from: relation.sessions.id,
//                 to: relation.events.sessionId,
//             }),
//         },
//         sessions: {
//             events: relation.many.events(),
//         },
//     }),
// );
//

export const reports = pgTable("reports", {
    id: uuid().primaryKey().defaultRandom(),
    created: timestamp().defaultNow(),
    sessionId: uuid().notNull(),
    data: json().notNull(),
});
