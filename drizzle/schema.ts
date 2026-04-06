import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ─── Usuários ────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "coordinator", "teacher"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Campus / Unidades ────────────────────────────────────────────────────────
export const campuses = mysqlTable("campuses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Áreas de Ensino ──────────────────────────────────────────────────────────
export const teachingAreas = mysqlTable("teaching_areas", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Cursos ───────────────────────────────────────────────────────────────────
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["Técnico", "Subsequente", "Graduação", "FIC", "Pós-graduação"]).notNull(),
  campusId: int("campusId").notNull(),
  coordinatorId: int("coordinatorId"),
  duration: int("duration").notNull().default(6),
  classesFirstHalfYear: int("classesFirstHalfYear").default(1).notNull(),
  classesSecondHalfYear: int("classesSecondHalfYear").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Disciplinas ──────────────────────────────────────────────────────────────
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  semester: int("semester").notNull(),
  weeklyClasses: int("weeklyClasses").notNull().default(2),
  totalHours: int("totalHours"),
  areaId: int("areaId"),
  isElective: boolean("isElective").default(false).notNull(),
  isRemote: boolean("isRemote").default(false).notNull(),
  syllabus: text("syllabus"),
  bibliography: text("bibliography"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Documentos PPC ───────────────────────────────────────────────────────────
export const ppcDocuments = mysqlTable("ppc_documents", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId"),
  campusId: int("campusId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "extracted", "approved", "rejected"]).default("pending").notNull(),
  extractedData: json("extractedData"),
  uploadedBy: int("uploadedBy").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Solicitações de Aprovação (Indicação de Área) ────────────────────────────
export const approvalRequests = mysqlTable("approval_requests", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  courseId: int("courseId").notNull(),
  requestedBy: int("requestedBy").notNull(),
  assignedTo: int("assignedTo"),
  status: mysqlEnum("status", ["pending", "responded", "approved", "rejected"]).default("pending").notNull(),
  suggestedAreaId: int("suggestedAreaId"),
  adminNotes: text("adminNotes"),
  coordinatorNotes: text("coordinatorNotes"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Vínculos Usuário-Curso (Coordenadores/Docentes por Curso) ────────────────
export const userCourseRoles = mysqlTable("user_course_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId"),
  campusId: int("campusId"),
  role: mysqlEnum("role", ["coordinator", "teacher"]).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Histórico de Auditoria ───────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userEmail: varchar("userEmail", { length: 320 }),
  userName: varchar("userName", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: int("entityId"),
  oldValue: json("oldValue"),
  newValue: json("newValue"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Quadro de Oferta (Turmas ofertadas por semestre) ──────────────────────────────
export const courseOfferings = mysqlTable("course_offerings", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  campusId: int("campusId").notNull(),
  /** Semestre letivo no formato "2020/1", "2020/2", "2021/1" etc. */
  academicTerm: varchar("academicTerm", { length: 10 }).notNull(),
  /** Nome do edital de seleção */
  selectionNotice: varchar("selectionNotice", { length: 500 }),
  /** Número de entradas/turmas (default 1) */
  numberOfEntries: int("numberOfEntries").notNull().default(1),
  /** Se a oferta está ativa */
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Campus = typeof campuses.$inferSelect;
export type InsertCampus = typeof campuses.$inferInsert;
export type TeachingArea = typeof teachingAreas.$inferSelect;
export type InsertTeachingArea = typeof teachingAreas.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;
export type PpcDocument = typeof ppcDocuments.$inferSelect;
export type InsertPpcDocument = typeof ppcDocuments.$inferInsert;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = typeof approvalRequests.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type UserCourseRole = typeof userCourseRoles.$inferSelect;
export type CourseOffering = typeof courseOfferings.$inferSelect;
export type InsertCourseOffering = typeof courseOfferings.$inferInsert;
