import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  approvalRequests,
  auditLogs,
  campusAreas,
  campuses,
  courseOfferings,
  courses,
  InsertUser,
  ppcDocuments,
  subjects,
  teachingAreas,
  userCourseRoles,
  users,
} from "../drizzle/schema";
import { ifmsColorTokens } from "../shared/branding/ifmsTokens";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId || (ENV.ownerEmail && user.email === ENV.ownerEmail)) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "coordinator" | "teacher") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Campus ───────────────────────────────────────────────────────────────────
export async function getCampuses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campuses).where(eq(campuses.active, true)).orderBy(campuses.name);
}

export async function createCampus(data: { name: string; city?: string; state?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(campuses).values(data);
  return result[0];
}

export async function updateCampus(id: number, data: { name?: string; city?: string; state?: string; active?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(campuses).set(data).where(eq(campuses.id, id));
}

export async function deleteCampus(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(campuses).set({ active: false }).where(eq(campuses.id, id));
}

// ─── Teaching Areas ───────────────────────────────────────────────────────────
export async function getTeachingAreas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teachingAreas).where(eq(teachingAreas.active, true)).orderBy(teachingAreas.name);
}

export async function createTeachingArea(data: { name: string; description?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(teachingAreas).values(data);
}

export async function updateTeachingArea(id: number, data: { name?: string; description?: string; color?: string; active?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(teachingAreas).set(data).where(eq(teachingAreas.id, id));
}

export async function deleteTeachingArea(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(teachingAreas).set({ active: false }).where(eq(teachingAreas.id, id));
}

// ─── Courses ──────────────────────────────────────────────────────────────────
export async function getCourses(filters?: { campusId?: number; type?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(courses.active, true)];
  if (filters?.campusId) conditions.push(eq(courses.campusId, filters.campusId));
  return db.select().from(courses).where(and(...conditions)).orderBy(courses.name);
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result[0];
}

export async function createCourse(data: {
  name: string;
  type: "Técnico" | "Subsequente" | "Graduação" | "FIC" | "Pós-graduação";
  campusId: number;
  duration: number;
  classesFirstHalfYear: number;
  classesSecondHalfYear: number;
  coordinatorId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(courses).values(data);
  return result[0];
}

export async function updateCourse(id: number, data: Partial<typeof courses.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(courses).set({ active: false }).where(eq(courses.id, id));
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
export async function getSubjectsByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(subjects)
    .where(and(eq(subjects.courseId, courseId), eq(subjects.active, true)))
    .orderBy(subjects.semester, subjects.name);
}

export async function findOrCreateCampus(name: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const trimmedName = name.trim();
  const existing = await db.select().from(campuses).where(sql`LOWER(${campuses.name}) = LOWER(${trimmedName})`).limit(1);
  if (existing.length > 0) return existing[0].id;
  const [result] = await db.insert(campuses).values({ name: trimmedName }).$returningId();
  return result.id;
}

export async function findOrCreateCourse(data: {
  name: string;
  type: string;
  campusId: number;
  duration?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db
    .select()
    .from(courses)
    .where(and(eq(courses.name, data.name), eq(courses.campusId, data.campusId)))
    .limit(1);
  if (existing.length > 0) return existing[0].id;
  const validTypes = ["T\u00e9cnico", "Subsequente", "Gradua\u00e7\u00e3o", "FIC", "P\u00f3s-gradua\u00e7\u00e3o"] as const;
  const courseType = validTypes.includes(data.type as any) ? (data.type as typeof validTypes[number]) : "T\u00e9cnico";
  const [result] = await db.insert(courses).values({
    name: data.name,
    type: courseType,
    campusId: data.campusId,
    duration: data.duration ?? 6,
  }).$returningId();
  return result.id;
}

// Removida: findOrCreateTeachingArea — áreas agora são pré-cadastradas pelo admin

// ─── Campus Areas (Vínculo Campus ↔ Áreas) ────────────────────────────────────
export async function getCampusAreas(campusId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ area: teachingAreas })
    .from(campusAreas)
    .innerJoin(teachingAreas, eq(campusAreas.areaId, teachingAreas.id))
    .where(and(eq(campusAreas.campusId, campusId), eq(teachingAreas.active, true)))
    .orderBy(teachingAreas.name);
  return rows.map(r => r.area);
}

export async function addAreaToCampus(campusId: number, areaId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Evitar duplicata
  const existing = await db.select().from(campusAreas)
    .where(and(eq(campusAreas.campusId, campusId), eq(campusAreas.areaId, areaId))).limit(1);
  if (existing.length > 0) return; // já vinculado
  await db.insert(campusAreas).values({ campusId, areaId });
}

export async function removeAreaFromCampus(campusId: number, areaId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(campusAreas)
    .where(and(eq(campusAreas.campusId, campusId), eq(campusAreas.areaId, areaId)));
}

export async function setCampusAreas(campusId: number, areaIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Remove todos os vínculos atuais e recria
  await db.delete(campusAreas).where(eq(campusAreas.campusId, campusId));
  if (areaIds.length > 0) {
    await db.insert(campusAreas).values(areaIds.map(areaId => ({ campusId, areaId })));
  }
}

/** Busca área por nome dentro das áreas vinculadas ao campus (case-insensitive). Retorna null se não encontrar. */
export async function findAreaInCampus(campusId: number, name: string): Promise<number | null> {
  if (!name?.trim()) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ id: teachingAreas.id })
    .from(campusAreas)
    .innerJoin(teachingAreas, eq(campusAreas.areaId, teachingAreas.id))
    .where(and(
      eq(campusAreas.campusId, campusId),
      eq(teachingAreas.active, true),
      sql`LOWER(${teachingAreas.name}) = LOWER(${name.trim()})`
    ))
    .limit(1);
  return rows.length > 0 ? rows[0].id : null;
}

export async function createSubject(data: {
  courseId: number;
  name: string;
  semester: number;
  weeklyClasses: number;
  totalHours?: number;
  areaId?: number;
  isElective?: boolean;
  isRemote?: boolean;
  syllabus?: string;
  bibliography?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(subjects).values(data);
}

export async function updateSubject(id: number, data: Partial<typeof subjects.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(subjects).set(data).where(eq(subjects.id, id));
}

export async function deleteSubject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(subjects).set({ active: false }).where(eq(subjects.id, id));
}

export async function getSubjectsWithoutArea(courseId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(subjects.active, true), isNull(subjects.areaId)];
  if (courseId) conditions.push(eq(subjects.courseId, courseId));
  return db.select().from(subjects).where(and(...conditions)).orderBy(subjects.courseId, subjects.semester);
}

export async function getSubjectsByIds(ids: number[]) {
  if (ids.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(subjects).where(sql`${subjects.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
  return result;
}

// ─── PPC Documents ────────────────────────────────────────────────────────────
export async function getPpcDocuments(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    return db.select().from(ppcDocuments).where(eq(ppcDocuments.uploadedBy, userId)).orderBy(desc(ppcDocuments.createdAt));
  }
  return db.select().from(ppcDocuments).orderBy(desc(ppcDocuments.createdAt));
}

export async function createPpcDocument(data: {
  fileName: string;
  fileUrl: string;
  fileKey: string;
  uploadedBy: number;
  courseId?: number;
  campusId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(ppcDocuments).values(data);
  return result[0];
}

export async function updatePpcDocument(id: number, data: Partial<typeof ppcDocuments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(ppcDocuments).set(data).where(eq(ppcDocuments.id, id));
}

// ─── Approval Requests ────────────────────────────────────────────────────────
export async function getApprovalRequests(filters?: { status?: string; courseId?: number; assignedTo?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(approvalRequests.status, filters.status as any));
  if (filters?.courseId) conditions.push(eq(approvalRequests.courseId, filters.courseId));
  if (filters?.assignedTo) conditions.push(eq(approvalRequests.assignedTo, filters.assignedTo));
  const query = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(approvalRequests).where(query).orderBy(desc(approvalRequests.createdAt));
}

export async function createApprovalRequest(data: {
  subjectId: number;
  courseId: number;
  requestedBy: number;
  assignedTo?: number;
  adminNotes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(approvalRequests).values(data);
}

export async function respondApprovalRequest(id: number, data: {
  suggestedAreaId: number;
  coordinatorNotes?: string;
  status: "responded" | "approved" | "rejected";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(approvalRequests).set({ ...data, respondedAt: new Date() }).where(eq(approvalRequests.id, id));
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export async function createAuditLog(data: {
  userId?: number;
  userEmail?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: number;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      ...data,
      oldValue: data.oldValue ? data.oldValue : null,
      newValue: data.newValue ? data.newValue : null,
    } as any);
  } catch (e) {
    console.error("[Audit] Failed to log:", e);
  }
}

export async function getAuditLogs(filters?: { entity?: string; entityId?: number; userId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.entity) conditions.push(eq(auditLogs.entity, filters.entity));
  if (filters?.entityId) conditions.push(eq(auditLogs.entityId, filters.entityId));
  if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
  const query = conditions.length > 0 ? and(...conditions) : undefined;
  return db
    .select()
    .from(auditLogs)
    .where(query)
    .orderBy(desc(auditLogs.createdAt))
    .limit(filters?.limit ?? 100);
}

// ─── Dashboard Aggregations ───────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalCourses] = await db.select({ count: sql<number>`count(*)` }).from(courses).where(eq(courses.active, true));
  const [totalSubjects] = await db.select({ count: sql<number>`count(*)` }).from(subjects).where(eq(subjects.active, true));
  const [totalCampuses] = await db.select({ count: sql<number>`count(*)` }).from(campuses).where(eq(campuses.active, true));
  const [totalAreas] = await db.select({ count: sql<number>`count(*)` }).from(teachingAreas).where(eq(teachingAreas.active, true));
  const [pendingApprovals] = await db.select({ count: sql<number>`count(*)` }).from(approvalRequests).where(eq(approvalRequests.status, "pending"));
  const [subjectsWithoutArea] = await db.select({ count: sql<number>`count(*)` }).from(subjects).where(and(eq(subjects.active, true), isNull(subjects.areaId)));

  return {
    totalCourses: Number(totalCourses?.count ?? 0),
    totalSubjects: Number(totalSubjects?.count ?? 0),
    totalCampuses: Number(totalCampuses?.count ?? 0),
    totalAreas: Number(totalAreas?.count ?? 0),
    pendingApprovals: Number(pendingApprovals?.count ?? 0),
    subjectsWithoutArea: Number(subjectsWithoutArea?.count ?? 0),
  };
}

export async function getClassesByArea(campusId?: number) {
  const db = await getDb();
  if (!db) return [];

  const allCourses = campusId
    ? await db.select().from(courses).where(and(eq(courses.active, true), eq(courses.campusId, campusId)))
    : await db.select().from(courses).where(eq(courses.active, true));

  const allSubjects = await db.select().from(subjects).where(eq(subjects.active, true));
  const allAreas = await db.select().from(teachingAreas).where(eq(teachingAreas.active, true));

  const courseIds = new Set(allCourses.map((c) => c.id));
  const filteredSubjects = allSubjects.filter((s) => courseIds.has(s.courseId));

  const areaMap = new Map(allAreas.map((a) => [a.id, a]));
  const result: { areaId: number; areaName: string; color: string; totalWeeklyClasses: number; subjectCount: number }[] = [];

  for (const area of allAreas) {
    const areaSubjects = filteredSubjects.filter((s) => s.areaId === area.id);
    if (areaSubjects.length === 0) continue;
    result.push({
      areaId: area.id,
      areaName: area.name,
      color: area.color ?? ifmsColorTokens.green.hex,
      totalWeeklyClasses: areaSubjects.reduce((sum, s) => sum + s.weeklyClasses, 0),
      subjectCount: areaSubjects.length,
    });
  }

  return result.sort((a, b) => b.totalWeeklyClasses - a.totalWeeklyClasses);
}

export async function getClassesBySemester(courseId?: number, campusId?: number) {
  const db = await getDb();
  if (!db) return [];

  let allCourses = await db.select().from(courses).where(eq(courses.active, true));
  if (courseId) allCourses = allCourses.filter((c) => c.id === courseId);
  if (campusId) allCourses = allCourses.filter((c) => c.campusId === campusId);

  const allSubjects = await db.select().from(subjects).where(eq(subjects.active, true));
  const courseIds = new Set(allCourses.map((c) => c.id));
  const filteredSubjects = allSubjects.filter((s) => courseIds.has(s.courseId));

  const semesterMap = new Map<number, number>();
  for (const s of filteredSubjects) {
    semesterMap.set(s.semester, (semesterMap.get(s.semester) ?? 0) + s.weeklyClasses);
  }

  return Array.from(semesterMap.entries())
    .map(([semester, totalClasses]) => ({ semester, totalClasses }))
    .sort((a, b) => a.semester - b.semester);
}

export async function getReportData(filters: { areaId?: number; campusId?: number; courseId?: number }) {
  const db = await getDb();
  if (!db) return [];

  let allCourses = await db.select().from(courses).where(eq(courses.active, true));
  if (filters.campusId) allCourses = allCourses.filter((c) => c.campusId === filters.campusId);
  if (filters.courseId) allCourses = allCourses.filter((c) => c.id === filters.courseId);

  const allCampuses = await db.select().from(campuses);
  const allSubjects = await db.select().from(subjects).where(eq(subjects.active, true));
  const allAreas = await db.select().from(teachingAreas);

  const campusMap = new Map(allCampuses.map((c) => [c.id, c]));
  const areaMap = new Map(allAreas.map((a) => [a.id, a]));

  return allCourses.map((course) => {
    const courseSubjects = allSubjects.filter(
      (s) => s.courseId === course.id && (!filters.areaId || s.areaId === filters.areaId)
    );

    const semesterClasses: Record<number, number> = {};
    for (let i = 1; i <= course.duration; i++) {
      semesterClasses[i] = courseSubjects.filter((s) => s.semester === i).reduce((sum, s) => sum + s.weeklyClasses, 0);
    }

    let firstHalfYear = 0;
    let secondHalfYear = 0;
    const ingress1st = course.classesFirstHalfYear ?? 0;
    const ingress2nd = course.classesSecondHalfYear ?? 0;

    for (let sem = 1; sem <= course.duration; sem++) {
      const classesPerClassroom = semesterClasses[sem] ?? 0;
      if (classesPerClassroom === 0) continue;
      const isOddSemester = sem % 2 !== 0;
      if (ingress1st > 0) {
        if (isOddSemester) firstHalfYear += classesPerClassroom * ingress1st;
        else secondHalfYear += classesPerClassroom * ingress1st;
      }
      if (ingress2nd > 0) {
        if (isOddSemester) secondHalfYear += classesPerClassroom * ingress2nd;
        else firstHalfYear += classesPerClassroom * ingress2nd;
      }
    }

    return {
      ...course,
      campusName: campusMap.get(course.campusId)?.name ?? "Desconhecido",
      semesterClasses,
      firstHalfYear,
      secondHalfYear,
      total: firstHalfYear + secondHalfYear,
      subjects: courseSubjects.map((s) => ({
        ...s,
        areaName: s.areaId ? (areaMap.get(s.areaId)?.name ?? "Sem área") : "Sem área",
        areaColor: s.areaId ? (areaMap.get(s.areaId)?.color ?? ifmsColorTokens.green.hex) : ifmsColorTokens.green.hex,
      })),
    };
  }).filter((c) => c.total > 0);
}

export async function getReportByCourse() {
  const db = await getDb();
  if (!db) return [];
  const allCourses = await db.select().from(courses).where(eq(courses.active, true));
  const allSubjects = await db.select().from(subjects).where(eq(subjects.active, true));
  return allCourses.map((course) => {
    const courseSubjects = allSubjects.filter((s) => s.courseId === course.id);
    return {
      courseId: course.id,
      courseName: course.name,
      courseType: course.type,
      subjectCount: courseSubjects.length,
      totalWeeklyClasses: courseSubjects.reduce((s, d) => s + d.weeklyClasses, 0),
      withoutArea: courseSubjects.filter((s) => !s.areaId).length,
    };
  });
}

export async function getReportByCampus() {
  const db = await getDb();
  if (!db) return [];
  const allCampuses = await db.select().from(campuses).where(eq(campuses.active, true));
  const allCourses = await db.select().from(courses).where(eq(courses.active, true));
  const allSubjects = await db.select().from(subjects).where(eq(subjects.active, true));
  return allCampuses.map((campus) => {
    const campusCourses = allCourses.filter((c) => c.campusId === campus.id);
    const courseIds = new Set(campusCourses.map((c) => c.id));
    const campusSubjects = allSubjects.filter((s) => courseIds.has(s.courseId));
    return {
      campusId: campus.id,
      campusName: campus.name,
      courseCount: campusCourses.length,
      subjectCount: campusSubjects.length,
      totalWeeklyClasses: campusSubjects.reduce((s, d) => s + d.weeklyClasses, 0),
    };
  });
}

// ─── User Course Roles ────────────────────────────────────────────────────────
export async function getUserCourseRoles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userCourseRoles).where(and(eq(userCourseRoles.userId, userId), eq(userCourseRoles.active, true)));
}

export async function assignUserCourseRole(data: { userId: number; courseId?: number; campusId?: number; role: "coordinator" | "teacher" }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(userCourseRoles).values(data);
}

// ─── Course Offerings (Quadro de Oferta) ──────────────────────────────────
export async function getOfferings(filters?: { campusId?: number; courseId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(courseOfferings.active, true)];
  if (filters?.campusId) conditions.push(eq(courseOfferings.campusId, filters.campusId));
  if (filters?.courseId) conditions.push(eq(courseOfferings.courseId, filters.courseId));
  return db.select().from(courseOfferings).where(and(...conditions)).orderBy(courseOfferings.academicTerm);
}

export async function createOffering(data: {
  courseId: number;
  campusId: number;
  academicTerm: string;
  selectionNotice?: string;
  numberOfEntries?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(courseOfferings).values(data).$returningId();
  return result;
}

export async function updateOffering(id: number, data: Partial<{
  selectionNotice: string | null;
  numberOfEntries: number;
  active: boolean;
  academicTerm: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(courseOfferings).set(data).where(eq(courseOfferings.id, id));
}

export async function deleteOffering(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(courseOfferings).set({ active: false }).where(eq(courseOfferings.id, id));
}

/**
 * Calcula aulas semanais por área considerando as turmas ativas (offerings).
 * Para cada oferta ativa, identifica quais semestres do curso estão sendo cursados
 * naquele período e multiplica as aulas semanais pelo número de entradas.
 */
export async function getClassesByAreaFromOfferings() {
  const db = await getDb();
  if (!db) return [];
  const allOfferings = await db.select().from(courseOfferings).where(eq(courseOfferings.active, true));
  const allCourses = await db.select().from(courses).where(eq(courses.active, true));
  const allSubjects = await db.select().from(subjects).where(eq(subjects.active, true));
  const allAreas = await db.select().from(teachingAreas).where(eq(teachingAreas.active, true));

  // Determinar o semestre atual (2026/1)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentHalf = now.getMonth() < 6 ? 1 : 2;
  const currentTerm = `${currentYear}/${currentHalf}`;

  // Converter semestre acadêmico para número sequencial para cálculos
  function termToNumber(term: string): number {
    const [y, h] = term.split("/").map(Number);
    return y * 2 + (h - 1);
  }

  const currentTermNum = termToNumber(currentTerm);
  const courseMap = new Map(allCourses.map(c => [c.id, c]));

  // Para cada área, calcular total de aulas semanais ativas
  const areaClasses = new Map<number, { totalWeeklyClasses: number; subjectCount: number }>();
  let noAreaClasses = 0;
  let noAreaCount = 0;

  for (const offering of allOfferings) {
    const course = courseMap.get(offering.courseId);
    if (!course) continue;

    const offeringTermNum = termToNumber(offering.academicTerm);
    const semestersElapsed = currentTermNum - offeringTermNum + 1;

    // Se a turma já passou da duração do curso, pular
    if (semestersElapsed < 1 || semestersElapsed > course.duration) continue;

    // Disciplinas do semestre atual dessa turma
    const courseSubjects = allSubjects.filter(
      s => s.courseId === course.id && s.semester === semestersElapsed
    );

    for (const subj of courseSubjects) {
      const classes = subj.weeklyClasses * offering.numberOfEntries;
      if (subj.areaId) {
        const current = areaClasses.get(subj.areaId) || { totalWeeklyClasses: 0, subjectCount: 0 };
        current.totalWeeklyClasses += classes;
        current.subjectCount += 1;
        areaClasses.set(subj.areaId, current);
      } else {
        noAreaClasses += classes;
        noAreaCount += 1;
      }
    }
  }

  const areaMap = new Map(allAreas.map(a => [a.id, a]));
  const result = Array.from(areaClasses.entries()).map(([areaId, data]) => ({
    areaId,
    areaName: areaMap.get(areaId)?.name ?? "Desconhecida",
    color: areaMap.get(areaId)?.color ?? ifmsColorTokens.green.hex,
    totalWeeklyClasses: data.totalWeeklyClasses,
    subjectCount: data.subjectCount,
  }));

  if (noAreaClasses > 0) {
    result.push({
      areaId: 0,
      areaName: "Sem Área Definida",
      color: ifmsColorTokens.green.hex,
      totalWeeklyClasses: noAreaClasses,
      subjectCount: noAreaCount,
    });
  }

  return result.sort((a, b) => b.totalWeeklyClasses - a.totalWeeklyClasses);
}

/**
 * Calcula aulas semanais por semestre considerando as turmas ativas.
 */
export async function getClassesBySemesterFromOfferings() {
  const db = await getDb();
  if (!db) return [];
  const allOfferings = await db.select().from(courseOfferings).where(eq(courseOfferings.active, true));
  const allCourses = await db.select().from(courses).where(eq(courses.active, true));
  const allSubjects = await db.select().from(subjects).where(eq(subjects.active, true));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentHalf = now.getMonth() < 6 ? 1 : 2;
  const currentTerm = `${currentYear}/${currentHalf}`;

  function termToNumber(term: string): number {
    const [y, h] = term.split("/").map(Number);
    return y * 2 + (h - 1);
  }

  const currentTermNum = termToNumber(currentTerm);
  const courseMap = new Map(allCourses.map(c => [c.id, c]));

  // Agrupar por semestre acadêmico (1º, 2º, etc.)
  const semesterClasses = new Map<number, { totalClasses: number; subjectCount: number }>();

  for (const offering of allOfferings) {
    const course = courseMap.get(offering.courseId);
    if (!course) continue;

    const offeringTermNum = termToNumber(offering.academicTerm);
    const semestersElapsed = currentTermNum - offeringTermNum + 1;
    if (semestersElapsed < 1 || semestersElapsed > course.duration) continue;

    const courseSubjects = allSubjects.filter(
      s => s.courseId === course.id && s.semester === semestersElapsed
    );

    for (const subj of courseSubjects) {
      const classes = subj.weeklyClasses * offering.numberOfEntries;
      const current = semesterClasses.get(semestersElapsed) || { totalClasses: 0, subjectCount: 0 };
      current.totalClasses += classes;
      current.subjectCount += 1;
      semesterClasses.set(semestersElapsed, current);
    }
  }

  return Array.from(semesterClasses.entries())
    .map(([semester, data]) => ({
      semester,
      totalClasses: data.totalClasses,
      subjectCount: data.subjectCount,
    }))
    .sort((a, b) => a.semester - b.semester);
}

/**
 * Memória de Cálculo por Área — Algoritmo Preditivo por Editais
 *
 * Implementa o algoritmo de projeção no tempo descrito na documentação:
 * Para cada edital ativo, calcula em qual semestre do curso a turma estará
 * no 1º e 2º semestre do ANO ALVO, e soma as aulas das disciplinas da área.
 *
 * Fórmula do ciclo de vida:
 *   S_1º_sem = ((anoAlvo - anoInicioEdital) * 2) + 1 - (semestreInicio === 2 ? 1 : 0)
 *   S_2º_sem = S_1º_sem + 1
 *   Se S > duração do curso: turma já se formou, ignorar.
 *   Se S < 1: turma ainda não começou, ignorar.
 */
export async function getMemoryByArea(filters: { campusId?: number; areaId?: number; targetYear?: number }) {
  const db = await getDb();
  if (!db) return [];

  const targetYear = filters.targetYear ?? new Date().getFullYear();

  // 1. Buscar todos os editais ativos
  const allOfferings = await db
    .select({
      id: courseOfferings.id,
      courseId: courseOfferings.courseId,
      campusId: courseOfferings.campusId,
      academicTerm: courseOfferings.academicTerm,
      numberOfEntries: courseOfferings.numberOfEntries,
    })
    .from(courseOfferings)
    .where(eq(courseOfferings.active, true));

  if (allOfferings.length === 0) return [];

  // 2. Buscar todos os cursos ativos com suas disciplinas e áreas
  const allSubjectRows = await db
    .select({
      areaId: teachingAreas.id,
      areaName: teachingAreas.name,
      areaColor: teachingAreas.color,
      courseId: courses.id,
      courseName: courses.name,
      courseType: courses.type,
      courseDuration: courses.duration,
      campusId: campuses.id,
      campusName: campuses.name,
      subjectId: subjects.id,
      subjectName: subjects.name,
      semester: subjects.semester,
      weeklyClasses: subjects.weeklyClasses,
      totalHours: subjects.totalHours,
      isElective: subjects.isElective,
    })
    .from(subjects)
    .innerJoin(courses, eq(subjects.courseId, courses.id))
    .innerJoin(campuses, eq(courses.campusId, campuses.id))
    .innerJoin(teachingAreas, eq(subjects.areaId, teachingAreas.id))
    .where(
      and(
        eq(subjects.active, true),
        eq(courses.active, true),
        filters.campusId ? eq(campuses.id, filters.campusId) : undefined,
        filters.areaId ? eq(teachingAreas.id, filters.areaId) : undefined,
      )
    );

  // 3. Indexar disciplinas por courseId → semestre do curso
  type SubjectInfo = { id: number; name: string; weeklyClasses: number; totalHours: number | null; isElective: boolean };
  const subjectsByCourseAndSemester = new Map<string, SubjectInfo[]>();
  const courseMetaMap = new Map<number, { courseName: string; courseType: string | null; courseDuration: number; campusId: number; campusName: string }>();
  const areaMetaMap = new Map<number, { areaName: string; areaColor: string | null }>();
  const courseAreaMap = new Map<string, boolean>(); // "courseId-areaId" para saber quais áreas um curso tem

  for (const row of allSubjectRows) {
    const key = `${row.courseId}-${row.semester}`;
    if (!subjectsByCourseAndSemester.has(key)) subjectsByCourseAndSemester.set(key, []);
    subjectsByCourseAndSemester.get(key)!.push({
      id: row.subjectId,
      name: row.subjectName,
      weeklyClasses: row.weeklyClasses,
      totalHours: row.totalHours,
      isElective: row.isElective ?? false,
    });
    if (!courseMetaMap.has(row.courseId)) {
      courseMetaMap.set(row.courseId, {
        courseName: row.courseName,
        courseType: row.courseType,
        courseDuration: row.courseDuration,
        campusId: row.campusId,
        campusName: row.campusName,
      });
    }
    if (!areaMetaMap.has(row.areaId)) {
      areaMetaMap.set(row.areaId, { areaName: row.areaName, areaColor: row.areaColor });
    }
    courseAreaMap.set(`${row.courseId}-${row.areaId}`, true);
  }

  // 4. Algoritmo preditivo: para cada edital, calcular S_Atual no 1º e 2º sem. do ano alvo
  //    Faz o parse do academicTerm (ex: "2026/1" ou "2026/2")
  type OfferingContrib = {
    offeringId: number;
    academicTerm: string;
    numberOfEntries: number;
    courseSemester1st: number; // semestre do curso no 1º sem. do ano alvo
    courseSemester2nd: number; // semestre do curso no 2º sem. do ano alvo
    firstHalfClasses: number;  // aulas semanais no 1º sem. do ano alvo
    secondHalfClasses: number; // aulas semanais no 2º sem. do ano alvo
    subjects1st: SubjectInfo[];
    subjects2nd: SubjectInfo[];
  };

  // Estrutura: area → campus → curso → contribuições dos editais
  type CourseEntry = {
    courseId: number;
    courseName: string;
    courseType: string | null;
    offerings: OfferingContrib[];
    firstHalfTotal: number;
    secondHalfTotal: number;
  };
  type CampusEntry = { campusId: number; campusName: string; courses: Map<number, CourseEntry> };
  type AreaEntry = { areaId: number; areaName: string; areaColor: string | null; campuses: Map<number, CampusEntry> };

  const areaMap = new Map<number, AreaEntry>();

  // Filtrar editais que pertencem a cursos com disciplinas da área filtrada (ou todas as áreas)
  const relevantCourseIds = new Set(allSubjectRows.map(r => r.courseId));

  for (const offering of allOfferings) {
    if (!relevantCourseIds.has(offering.courseId)) continue;
    const courseMeta = courseMetaMap.get(offering.courseId);
    if (!courseMeta) continue;

    // Aplicar filtro de campus se especificado
    if (filters.campusId && courseMeta.campusId !== filters.campusId) continue;

    // Parse do academicTerm: "YYYY/H"
    const parts = offering.academicTerm.split("/");
    const anoInicio = parseInt(parts[0]);
    const semestreInicio = parseInt(parts[1]); // 1 ou 2

    // Fases do algoritmo (conforme documentação):
    // S_1º_sem = ((anoAlvo - anoInicio) * 2) + 1 - (semestreInicio === 2 ? 1 : 0)
    const s1 = ((targetYear - anoInicio) * 2) + 1 - (semestreInicio === 2 ? 1 : 0);
    // S_2º_sem = S_1º_sem + 1 (exceto caso especial: edital começa no 2º sem. do próprio ano alvo)
    const s2 = s1 + 1;

    const duration = courseMeta.courseDuration;

    // Verificar ciclo de vida: se a turma já se formou antes do ano alvo, ignorar
    // Semestres decorridos até o início do ano alvo:
    const semDecorridos = ((targetYear - anoInicio) * 2) - (semestreInicio === 2 ? 1 : 0);
    if (semDecorridos >= duration) continue; // já formou

    // Para cada área que este curso possui disciplinas
    const areaIdsForCourse = new Set(
      allSubjectRows.filter(r => r.courseId === offering.courseId).map(r => r.areaId)
    );

    for (const areaId of Array.from(areaIdsForCourse)) {
      if (filters.areaId && areaId !== filters.areaId) continue;

      const areaMeta = areaMetaMap.get(areaId)!;

      // Buscar disciplinas da área no semestre s1 e s2
      const subs1 = (s1 >= 1 && s1 <= duration) ? (subjectsByCourseAndSemester.get(`${offering.courseId}-${s1}`) ?? []).filter(s => {
        // Verificar se a disciplina pertence a esta área
        const subRow = allSubjectRows.find(r => r.subjectId === s.id);
        return subRow?.areaId === areaId;
      }) : [];
      const subs2 = (s2 >= 1 && s2 <= duration) ? (subjectsByCourseAndSemester.get(`${offering.courseId}-${s2}`) ?? []).filter(s => {
        const subRow = allSubjectRows.find(r => r.subjectId === s.id);
        return subRow?.areaId === areaId;
      }) : [];

      const first1 = subs1.reduce((acc, s) => acc + s.weeklyClasses, 0) * offering.numberOfEntries;
      const first2 = subs2.reduce((acc, s) => acc + s.weeklyClasses, 0) * offering.numberOfEntries;

      if (first1 === 0 && first2 === 0) continue;

      // Garantir estrutura na áreaMap
      if (!areaMap.has(areaId)) {
        areaMap.set(areaId, { areaId, areaName: areaMeta.areaName, areaColor: areaMeta.areaColor, campuses: new Map() });
      }
      const area = areaMap.get(areaId)!;
      if (!area.campuses.has(courseMeta.campusId)) {
        area.campuses.set(courseMeta.campusId, { campusId: courseMeta.campusId, campusName: courseMeta.campusName, courses: new Map() });
      }
      const campus = area.campuses.get(courseMeta.campusId)!;
      if (!campus.courses.has(offering.courseId)) {
        campus.courses.set(offering.courseId, {
          courseId: offering.courseId,
          courseName: courseMeta.courseName,
          courseType: courseMeta.courseType,
          offerings: [],
          firstHalfTotal: 0,
          secondHalfTotal: 0,
        });
      }
      const courseEntry = campus.courses.get(offering.courseId)!;
      courseEntry.offerings.push({
        offeringId: offering.id,
        academicTerm: offering.academicTerm,
        numberOfEntries: offering.numberOfEntries,
        courseSemester1st: s1,
        courseSemester2nd: s2,
        firstHalfClasses: first1,
        secondHalfClasses: first2,
        subjects1st: subs1,
        subjects2nd: subs2,
      });
      courseEntry.firstHalfTotal += first1;
      courseEntry.secondHalfTotal += first2;
    }
  }

  // 5. Serializar para array
  return Array.from(areaMap.values()).map(area => ({
    areaId: area.areaId,
    areaName: area.areaName,
    areaColor: area.areaColor,
    campuses: Array.from(area.campuses.values()).map(campus => {
      const serializedCourses = Array.from(campus.courses.values()).map(course => ({
        courseId: course.courseId,
        courseName: course.courseName,
        courseType: course.courseType,
        firstHalfTotal: course.firstHalfTotal,
        secondHalfTotal: course.secondHalfTotal,
        totalClasses: course.firstHalfTotal + course.secondHalfTotal,
        offerings: course.offerings,
      }));

      const campusFirstHalf  = serializedCourses.reduce((s, c) => s + c.firstHalfTotal, 0);
      const campusSecondHalf = serializedCourses.reduce((s, c) => s + c.secondHalfTotal, 0);

      return {
        campusId: campus.campusId,
        campusName: campus.campusName,
        courses: serializedCourses,
        semesterSummary: [
          { calendarSemester: 1, label: "1º Semestre do Ano", weeklyClasses: campusFirstHalf },
          { calendarSemester: 2, label: "2º Semestre do Ano", weeklyClasses: campusSecondHalf },
        ],
      };
    }),
  }));
}
