import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mock do banco de dados ──────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getCampuses: vi.fn().mockResolvedValue([
    { id: 1, name: "Campus Campo Grande", city: "Campo Grande", state: "MS", createdAt: new Date(), updatedAt: new Date() },
  ]),
  getCampusById: vi.fn().mockResolvedValue({ id: 1, name: "Campus Campo Grande", city: "Campo Grande", state: "MS", createdAt: new Date(), updatedAt: new Date() }),
  createCampus: vi.fn().mockResolvedValue({ id: 2, name: "Campus Aquidauana", city: "Aquidauana", state: "MS", createdAt: new Date(), updatedAt: new Date() }),
  updateCampus: vi.fn().mockResolvedValue({ id: 1, name: "Campus Campo Grande (Atualizado)", city: "Campo Grande", state: "MS", createdAt: new Date(), updatedAt: new Date() }),
  deleteCampus: vi.fn().mockResolvedValue(undefined),
  getTeachingAreas: vi.fn().mockResolvedValue([
    { id: 1, name: "Matemática", color: "#16a34a", description: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, name: "Português", color: "#2563eb", description: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getTeachingAreaById: vi.fn().mockResolvedValue({ id: 1, name: "Matemática", color: "#16a34a", description: null, createdAt: new Date(), updatedAt: new Date() }),
  createTeachingArea: vi.fn().mockResolvedValue({ id: 3, name: "Física", color: "#9333ea", description: null, createdAt: new Date(), updatedAt: new Date() }),
  updateTeachingArea: vi.fn().mockResolvedValue({ id: 1, name: "Matemática (Atualizado)", color: "#16a34a", description: null, createdAt: new Date(), updatedAt: new Date() }),
  deleteTeachingArea: vi.fn().mockResolvedValue(undefined),
  getCourses: vi.fn().mockResolvedValue([
    { id: 1, name: "Técnico em Informática", type: "Técnico", campusId: 1, duration: 3, classesFirstHalfYear: 2, classesSecondHalfYear: 2, coordinatorId: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getCourseById: vi.fn().mockResolvedValue({ id: 1, name: "Técnico em Informática", type: "Técnico", campusId: 1, duration: 3, classesFirstHalfYear: 2, classesSecondHalfYear: 2, coordinatorId: null, createdAt: new Date(), updatedAt: new Date() }),
  createCourse: vi.fn().mockResolvedValue({ id: 2, name: "Técnico em Administração", type: "Técnico", campusId: 1, duration: 3, classesFirstHalfYear: 2, classesSecondHalfYear: 2, coordinatorId: null, createdAt: new Date(), updatedAt: new Date() }),
  updateCourse: vi.fn().mockResolvedValue({ id: 1, name: "Técnico em Informática (Atualizado)", type: "Técnico", campusId: 1, duration: 3, classesFirstHalfYear: 2, classesSecondHalfYear: 2, coordinatorId: null, createdAt: new Date(), updatedAt: new Date() }),
  deleteCourse: vi.fn().mockResolvedValue(undefined),
  getSubjectsByCourse: vi.fn().mockResolvedValue([
    { id: 1, courseId: 1, name: "Algoritmos", semester: 1, weeklyClasses: 4, totalHours: 80, areaId: 1, isElective: false, isRemote: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, courseId: 1, name: "Banco de Dados", semester: 2, weeklyClasses: 3, totalHours: 60, areaId: null, isElective: false, isRemote: false, createdAt: new Date(), updatedAt: new Date() },
  ]),
  createSubject: vi.fn().mockResolvedValue({ id: 3, courseId: 1, name: "Redes de Computadores", semester: 3, weeklyClasses: 3, totalHours: 60, areaId: null, isElective: false, isRemote: false, createdAt: new Date(), updatedAt: new Date() }),
  updateSubject: vi.fn().mockResolvedValue({ id: 1, courseId: 1, name: "Algoritmos (Atualizado)", semester: 1, weeklyClasses: 4, totalHours: 80, areaId: 1, isElective: false, isRemote: false, createdAt: new Date(), updatedAt: new Date() }),
  deleteSubject: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({ totalCampuses: 3, totalCourses: 12, totalSubjects: 145, totalAreas: 8, pendingApprovals: 5, subjectsWithoutArea: 23 }),
  getClassesByArea: vi.fn().mockResolvedValue([
    { areaId: 1, areaName: "Matemática", color: "#16a34a", totalWeeklyClasses: 48, subjectCount: 12 },
    { areaId: 2, areaName: "Português", color: "#2563eb", totalWeeklyClasses: 36, subjectCount: 9 },
  ]),
  getClassesBySemester: vi.fn().mockResolvedValue([
    { semester: 1, totalClasses: 20, subjectCount: 5 },
    { semester: 2, totalClasses: 18, subjectCount: 4 },
    { semester: 3, totalClasses: 22, subjectCount: 6 },
  ]),
  getApprovalRequests: vi.fn().mockResolvedValue([
    { id: 1, subjectId: 2, courseId: 1, status: "pending", requestedById: 1, assignedToId: null, suggestedAreaId: null, adminNotes: null, coordinatorNotes: null, respondedAt: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  createApprovalRequest: vi.fn().mockResolvedValue({ id: 2, subjectId: 2, courseId: 1, status: "pending", requestedById: 1, assignedToId: null, suggestedAreaId: null, adminNotes: null, coordinatorNotes: null, respondedAt: null, createdAt: new Date(), updatedAt: new Date() }),
  respondApprovalRequest: vi.fn().mockResolvedValue({ id: 1, status: "responded", suggestedAreaId: 1, coordinatorNotes: "Área adequada", respondedAt: new Date() }),
  getSubjectsWithoutArea: vi.fn().mockResolvedValue([]),
  getSubjectsByIds: vi.fn().mockResolvedValue([
    { id: 1, courseId: 1, name: "Algoritmos", semester: 1, weeklyClasses: 4, totalHours: 80, areaId: 1, isElective: false, isRemote: false, syllabus: null, bibliography: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  findOrCreateCampus: vi.fn().mockResolvedValue(1),
  findOrCreateCourse: vi.fn().mockResolvedValue(1),
  findOrCreateTeachingArea: vi.fn().mockResolvedValue(1),
  getAuditLogs: vi.fn().mockResolvedValue([
    { id: 1, action: "CREATE", entity: "campus", entityId: 1, oldValue: null, newValue: { name: "Campus Campo Grande" }, userId: 1, userEmail: "admin@ifms.edu.br", userName: "Admin", createdAt: new Date() },
  ]),
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([
    { id: 1, openId: "user-1", name: "Fernando Silveira Alves", email: "fernando@ifms.edu.br", role: "admin", loginMethod: "google", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  ]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  getPpcDocuments: vi.fn().mockResolvedValue([]),
  createPpcDocument: vi.fn().mockResolvedValue({ id: 1, courseId: null, campusId: null, fileName: "ppc-test.pdf", fileUrl: "https://s3.example.com/ppc-test.pdf", fileKey: "ppcs/ppc-test.pdf", status: "uploaded", extractedData: null, uploadedById: 1, createdAt: new Date(), updatedAt: new Date() }),
  updatePpcDocument: vi.fn().mockResolvedValue(undefined),
  getReportData: vi.fn().mockResolvedValue([]),
  getReportByCourse: vi.fn().mockResolvedValue([
    { courseId: 1, courseName: "Técnico em Informática", courseType: "Técnico", subjectCount: 10, totalWeeklyClasses: 40, withoutArea: 2 },
  ]),
  getReportByCampus: vi.fn().mockResolvedValue([
    { campusId: 1, campusName: "Campus Campo Grande", courseCount: 5, subjectCount: 50, totalWeeklyClasses: 200 },
  ]),
  getUserCourseRoles: vi.fn().mockResolvedValue([]),
  assignUserCourseRole: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers de contexto ─────────────────────────────────────────────────────
function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      name: "Fernando Silveira Alves",
      email: "fernando@ifms.edu.br",
      role: "admin",
      loginMethod: "google",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeCoordinatorCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "coord-user",
      name: "Coordenador Teste",
      email: "coord@ifms.edu.br",
      role: "coordinator" as any,
      loginMethod: "google",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Testes ──────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("retorna null para usuário não autenticado", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("retorna o usuário autenticado", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("fernando@ifms.edu.br");
    expect(result?.role).toBe("admin");
  });
});

describe("campus.list", () => {
  it("retorna lista de campus para admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.campus.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
  });

  it("retorna lista de campus para usuário não autenticado (rota pública)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.campus.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("areas.list", () => {
  it("retorna lista de áreas de ensino", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.areas.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("Matemática");
  });
});

describe("courses.list", () => {
  it("retorna lista de cursos", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.courses.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].name).toBe("Técnico em Informática");
  });
});

describe("subjects.listByCourse", () => {
  it("retorna disciplinas de um curso específico", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.subjects.listByCourse({ courseId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("Algoritmos");
  });
});

describe("dashboard.stats", () => {
  it("retorna estatísticas do dashboard", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.dashboard.stats();
    expect(result).toHaveProperty("totalCampuses");
    expect(result).toHaveProperty("totalCourses");
    expect(result).toHaveProperty("totalSubjects");
    expect(result).toHaveProperty("pendingApprovals");
    expect(result.totalCampuses).toBe(3);
    expect(result.totalCourses).toBe(12);
  });
});

describe("dashboard.classesByArea", () => {
  it("retorna aulas agrupadas por área", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.dashboard.classesByArea({});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("areaName");
    expect(result[0]).toHaveProperty("totalWeeklyClasses");
  });
});

describe("dashboard.classesBySemester", () => {
  it("retorna aulas agrupadas por semestre", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.dashboard.classesBySemester({});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("semester");
    expect(result[0]).toHaveProperty("totalClasses");
  });
});

describe("approval.list", () => {
  it("retorna solicitações de aprovação", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.approval.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("status");
    expect(result[0].status).toBe("pending");
  });
});

describe("reports.byCourse", () => {
  it("retorna relatório agrupado por curso", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.reports.byCourse();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("courseName");
    expect(result[0]).toHaveProperty("subjectCount");
    expect(result[0]).toHaveProperty("totalWeeklyClasses");
  });
});

describe("reports.byCampus", () => {
  it("retorna relatório agrupado por campus", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.reports.byCampus();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("campusName");
    expect(result[0]).toHaveProperty("courseCount");
    expect(result[0]).toHaveProperty("totalWeeklyClasses");
  });
});

describe("users.list (admin only)", () => {
  it("admin pode listar usuários", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.users.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].role).toBe("admin");
  });

  it("coordenador não pode listar usuários", async () => {
    const caller = appRouter.createCaller(makeCoordinatorCtx());
    await expect(caller.users.list()).rejects.toThrow();
  });
});

describe("audit.list (admin only)", () => {
  it("admin pode ver logs de auditoria", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.audit.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("action");
    expect(result[0]).toHaveProperty("entity");
    expect(result[0].action).toBe("CREATE");
  });

  it("usuário comum não pode ver logs de auditoria", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.audit.list({})).rejects.toThrow();
  });
});

// ── Mock do pdf-parse ──────────────────────────────────────────────────────
vi.mock("pdf-parse", () => ({
  PDFParse: vi.fn().mockImplementation((opts: any) => ({
    getText: vi.fn().mockResolvedValue({
      pages: opts?._testEmpty
        ? [{ text: "" }]
        : [
            { text: "PROJETO PEDAGÓGICO DO CURSO TÉCNICO EM INFORMÁTICA\nCampus Campo Grande\nDuração: 6 semestres\n" },
            { text: "1º Semestre\nAlgoritmos - 80h - 4 aulas semanais\nEmenta: Lógica de programação\nReferências: CORMEN, T.\n" },
          ],
    }),
  })),
}));

// ── Mock do invokeLLM ──────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          courseName: "Técnico em Informática",
          courseType: "Técnico",
          campusName: "Campus Campo Grande",
          duration: 6,
          subjects: [{
            name: "Algoritmos",
            semester: 1,
            weeklyClasses: 4,
            totalHours: 80,
            isElective: false,
            isRemote: false,
            suggestedArea: "Informática",
            syllabus: "Lógica de programação, estruturas de dados",
            bibliography: "CORMEN, T. Algoritmos. 3ª ed.",
          }],
        }),
      },
    }],
  }),
}));

// ── Mock do fetch global para download do PDF ──────────────────────────────
const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
  }) as any;
});

describe("ppc.extract", () => {
  it("extrai dados do PDF com sucesso via pdf-parse + LLM", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.ppc.extract({
      documentId: 1,
      fileUrl: "https://s3.example.com/ppc-test.pdf",
    });
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("courseName");
    expect(result.data).toHaveProperty("subjects");
    expect(result.data.courseName).toBe("Técnico em Informática");
    expect(result.data.subjects.length).toBeGreaterThan(0);
    expect(result.data.subjects[0]).toHaveProperty("syllabus");
    expect(result.data.subjects[0]).toHaveProperty("bibliography");
    expect(result.data.subjects[0]).toHaveProperty("suggestedArea");
  });

  it("falha quando o PDF não pode ser baixado", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as any;
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.ppc.extract({ documentId: 1, fileUrl: "https://s3.example.com/not-found.pdf" })
    ).rejects.toThrow();
  });
});
