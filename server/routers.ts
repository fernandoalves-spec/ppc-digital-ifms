import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  assignUserCourseRole,
  createApprovalRequest,
  createAuditLog,
  createCampus,
  createCourse,
  createPpcDocument,
  createSubject,
  createTeachingArea,
  deleteCampus,
  deleteCourse,
  deleteSubject,
  deleteTeachingArea,
  getApprovalRequests,
  getAuditLogs,
  getCampuses,
  getClassesByArea,
  getClassesBySemester,
  getCourseById,
  getCourses,
  getDashboardStats,
  getPpcDocuments,
  getReportByCampus,
  getReportByCourse,
  getReportData,
  getSubjectsByCourse,
  getSubjectsWithoutArea,
  getTeachingAreas,
  getAllUsers,
  getUserCourseRoles,
  respondApprovalRequest,
  updateCampus,
  updateCourse,
  updatePpcDocument,
  updateSubject,
  updateTeachingArea,
  updateUserRole,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ─── Middleware de Role ───────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  return next({ ctx });
});

const coordinatorOrAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "coordinator") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a coordenadores e administradores." });
  }
  return next({ ctx });
});

// ─── Helper de Auditoria ──────────────────────────────────────────────────────
async function audit(ctx: any, action: string, entity: string, entityId?: number, oldValue?: unknown, newValue?: unknown) {
  await createAuditLog({
    userId: ctx.user?.id,
    userEmail: ctx.user?.email ?? undefined,
    userName: ctx.user?.name ?? undefined,
    action,
    entity,
    entityId,
    oldValue,
    newValue,
    ipAddress: ctx.req?.ip,
  });
}

// ─── Campus Router ────────────────────────────────────────────────────────────
const campusRouter = router({
  list: publicProcedure.query(() => getCampuses()),

  create: adminProcedure
    .input(z.object({ name: z.string().min(2), city: z.string().optional(), state: z.string().max(2).optional() }))
    .mutation(async ({ input, ctx }) => {
      await createCampus(input);
      await audit(ctx, "CREATE", "campus", undefined, null, input);
      return { success: true };
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), city: z.string().optional(), state: z.string().optional(), active: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateCampus(id, data);
      await audit(ctx, "UPDATE", "campus", id, null, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteCampus(input.id);
      await audit(ctx, "DELETE", "campus", input.id);
      return { success: true };
    }),
});

// ─── Teaching Areas Router ────────────────────────────────────────────────────
const areasRouter = router({
  list: publicProcedure.query(() => getTeachingAreas()),

  create: adminProcedure
    .input(z.object({ name: z.string().min(2), description: z.string().optional(), color: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      await createTeachingArea(input);
      await audit(ctx, "CREATE", "teaching_area", undefined, null, input);
      return { success: true };
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), color: z.string().optional(), active: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateTeachingArea(id, data);
      await audit(ctx, "UPDATE", "teaching_area", id, null, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteTeachingArea(input.id);
      await audit(ctx, "DELETE", "teaching_area", input.id);
      return { success: true };
    }),
});

// ─── Courses Router ───────────────────────────────────────────────────────────
const coursesRouter = router({
  list: publicProcedure
    .input(z.object({ campusId: z.number().optional(), type: z.string().optional() }).optional())
    .query(({ input }) => getCourses(input)),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCourseById(input.id)),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(2),
      type: z.enum(["Técnico", "Subsequente", "Graduação", "FIC", "Pós-graduação"]),
      campusId: z.number(),
      duration: z.number().min(1).max(12),
      classesFirstHalfYear: z.number().min(0),
      classesSecondHalfYear: z.number().min(0),
      coordinatorId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await createCourse(input);
      await audit(ctx, "CREATE", "course", undefined, null, input);
      return { success: true };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      type: z.enum(["Técnico", "Subsequente", "Graduação", "FIC", "Pós-graduação"]).optional(),
      campusId: z.number().optional(),
      duration: z.number().optional(),
      classesFirstHalfYear: z.number().optional(),
      classesSecondHalfYear: z.number().optional(),
      coordinatorId: z.number().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateCourse(id, data);
      await audit(ctx, "UPDATE", "course", id, null, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteCourse(input.id);
      await audit(ctx, "DELETE", "course", input.id);
      return { success: true };
    }),
});

// ─── Subjects Router ──────────────────────────────────────────────────────────
const subjectsRouter = router({
  listByCourse: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(({ input }) => getSubjectsByCourse(input.courseId)),

  listWithoutArea: coordinatorOrAdminProcedure
    .input(z.object({ courseId: z.number().optional() }))
    .query(({ input }) => getSubjectsWithoutArea(input.courseId)),

  create: adminProcedure
    .input(z.object({
      courseId: z.number(),
      name: z.string().min(2),
      semester: z.number().min(1).max(12),
      weeklyClasses: z.number().min(1),
      totalHours: z.number().optional(),
      areaId: z.number().optional(),
      isElective: z.boolean().optional(),
      isRemote: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await createSubject(input);
      await audit(ctx, "CREATE", "subject", undefined, null, input);
      return { success: true };
    }),

  update: coordinatorOrAdminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      semester: z.number().optional(),
      weeklyClasses: z.number().optional(),
      totalHours: z.number().optional(),
      areaId: z.number().optional(),
      isElective: z.boolean().optional(),
      isRemote: z.boolean().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateSubject(id, data);
      await audit(ctx, "UPDATE", "subject", id, null, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteSubject(input.id);
      await audit(ctx, "DELETE", "subject", input.id);
      return { success: true };
    }),
});

// ─── PPC Documents Router ─────────────────────────────────────────────────────
const ppcRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    if (ctx.user.role === "admin") return getPpcDocuments();
    return getPpcDocuments(ctx.user.id);
  }),

  upload: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileBase64: z.string(),
      mimeType: z.string().default("application/pdf"),
    }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `ppc-documents/${ctx.user.id}-${nanoid(8)}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      await createPpcDocument({
        fileName: input.fileName,
        fileUrl: url,
        fileKey,
        uploadedBy: ctx.user.id,
      });

      await audit(ctx, "UPLOAD", "ppc_document", undefined, null, { fileName: input.fileName });
      return { success: true, fileUrl: url };
    }),

  extract: adminProcedure
    .input(z.object({ documentId: z.number(), fileUrl: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await updatePpcDocument(input.documentId, { status: "processing" });

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em análise de Projetos Pedagógicos de Curso (PPC) do IFMS.
Analise o documento PDF fornecido e extraia as seguintes informações em formato JSON estruturado:
- courseName: nome completo do curso
- courseType: tipo do curso (Técnico, Subsequente, Graduação, FIC ou Pós-graduação)
- campusName: nome do campus/unidade
- duration: duração em semestres (número inteiro)
- subjects: array de disciplinas com os campos:
  - name: nome da disciplina
  - semester: semestre em que é ofertada (número inteiro)
  - weeklyClasses: aulas semanais (número inteiro)
  - totalHours: carga horária total (número inteiro, se disponível)
  - isElective: se é optativa/eletiva (boolean)
  - isRemote: se é EaD/remota (boolean)

Retorne APENAS o JSON válido, sem texto adicional.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "file_url",
                  file_url: { url: input.fileUrl, mime_type: "application/pdf" },
                },
                { type: "text", text: "Extraia as informações do PPC deste documento." },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ppc_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  courseName: { type: "string" },
                  courseType: { type: "string" },
                  campusName: { type: "string" },
                  duration: { type: "integer" },
                  subjects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        semester: { type: "integer" },
                        weeklyClasses: { type: "integer" },
                        totalHours: { type: ["integer", "null"] },
                        isElective: { type: "boolean" },
                        isRemote: { type: "boolean" },
                      },
                      required: ["name", "semester", "weeklyClasses", "isElective", "isRemote"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["courseName", "courseType", "campusName", "duration", "subjects"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        const extractedData = typeof content === "string" ? JSON.parse(content) : content;

        await updatePpcDocument(input.documentId, {
          status: "extracted",
          extractedData,
          processedAt: new Date(),
        });

        await audit(ctx, "EXTRACT", "ppc_document", input.documentId, null, { courseName: extractedData.courseName });
        return { success: true, data: extractedData };
      } catch (error: any) {
        await updatePpcDocument(input.documentId, { status: "rejected" });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro na extração: ${error.message}` });
      }
    }),

  applyExtraction: adminProcedure
    .input(z.object({
      documentId: z.number(),
      courseId: z.number(),
      subjects: z.array(z.object({
        name: z.string(),
        semester: z.number(),
        weeklyClasses: z.number(),
        totalHours: z.number().optional().nullable(),
        isElective: z.boolean(),
        isRemote: z.boolean(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      for (const subject of input.subjects) {
        await createSubject({
          courseId: input.courseId,
          name: subject.name,
          semester: subject.semester,
          weeklyClasses: subject.weeklyClasses,
          totalHours: subject.totalHours ?? undefined,
          isElective: subject.isElective,
          isRemote: subject.isRemote,
        });
      }
      await updatePpcDocument(input.documentId, { status: "approved", courseId: input.courseId });
      await audit(ctx, "APPLY_EXTRACTION", "ppc_document", input.documentId, null, { courseId: input.courseId, subjectCount: input.subjects.length });
      return { success: true };
    }),
});

// ─── Approval Requests Router ─────────────────────────────────────────────────
const approvalRouter = router({
  list: coordinatorOrAdminProcedure
    .input(z.object({ status: z.string().optional(), courseId: z.number().optional() }).optional())
    .query(({ input, ctx }) => {
      if (ctx.user.role === "coordinator") {
        return getApprovalRequests({ ...input, assignedTo: ctx.user.id });
      }
      return getApprovalRequests(input);
    }),

   create: adminProcedure
    .input(z.object({
      subjectId: z.number(),
      courseId: z.number(),
      assignedTo: z.number().optional(),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await createApprovalRequest({ ...input, requestedBy: ctx.user.id });
      await audit(ctx, "CREATE", "approval_request", undefined, null, input);
      // Notificar o owner sobre nova solicitação
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({
          title: "Nova Solicitação de Área Docente",
          content: `O administrador ${ctx.user.name ?? ctx.user.email} criou uma nova solicitação de indicação de área docente para o curso #${input.courseId}. Acesse o sistema PPC Digital IFMS para responder.`,
        });
      } catch (e) {
        console.warn("[Notification] Falha ao enviar notificação:", e);
      }
      return { success: true };
    }),
  createBulk: adminProcedure
    .input(z.object({
      courseId: z.number(),
      assignedTo: z.number().optional(),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const subjectsWithoutArea = await getSubjectsWithoutArea(input.courseId);
      for (const subject of subjectsWithoutArea) {
        await createApprovalRequest({
          subjectId: subject.id,
          courseId: input.courseId,
          requestedBy: ctx.user.id,
          assignedTo: input.assignedTo,
          adminNotes: input.adminNotes,
        });
      }
      await audit(ctx, "CREATE_BULK", "approval_request", undefined, null, { courseId: input.courseId, count: subjectsWithoutArea.length });
      // Notificar o owner sobre solicitações em lote
      if (subjectsWithoutArea.length > 0) {
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: `${subjectsWithoutArea.length} Solicitações de Área Docente Criadas`,
            content: `O administrador ${ctx.user.name ?? ctx.user.email} criou ${subjectsWithoutArea.length} solicitação(oes) de indicação de área docente para o curso #${input.courseId}. Acesse o sistema PPC Digital IFMS para distribuir as solicitações aos coordenadores.`,
          });
        } catch (e) {
          console.warn("[Notification] Falha ao enviar notificação em lote:", e);
        }
      }
      return { success: true, count: subjectsWithoutArea.length };
    }),

  respond: coordinatorOrAdminProcedure
    .input(z.object({
      id: z.number(),
      suggestedAreaId: z.number(),
      coordinatorNotes: z.string().optional(),
      status: z.enum(["responded", "approved", "rejected"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await respondApprovalRequest(id, data);
      if (data.status === "responded" || data.status === "approved") {
        const requests = await getApprovalRequests({ status: "pending" });
        const req = requests.find((r) => r.id === id);
        if (req) {
          await updateSubject(req.subjectId, { areaId: data.suggestedAreaId });
        }
      }
      await audit(ctx, "RESPOND", "approval_request", id, null, data);
      return { success: true };
    }),
});

// ─── Dashboard Router ─────────────────────────────────────────────────────────
const dashboardRouter = router({
  stats: protectedProcedure.query(() => getDashboardStats()),

  classesByArea: protectedProcedure
    .input(z.object({ campusId: z.number().optional() }).optional())
    .query(({ input }) => getClassesByArea(input?.campusId)),

  classesBySemester: protectedProcedure
    .input(z.object({ courseId: z.number().optional(), campusId: z.number().optional() }).optional())
    .query(({ input }) => getClassesBySemester(input?.courseId, input?.campusId)),
});

/// ─── Reports Router ────────────────────────────────────────────────────────
const reportsRouter = router({
  data: protectedProcedure
    .input(z.object({
      areaId: z.number().optional(),
      campusId: z.number().optional(),
      courseId: z.number().optional(),
    }))
    .query(({ input }) => getReportData(input)),

  byCourse: protectedProcedure.query(() => getReportByCourse()),

  byCampus: protectedProcedure.query(() => getReportByCampus()),

  exportPdf: protectedProcedure
    .input(z.object({
      type: z.enum(["by_area", "by_semester", "by_course", "by_campus"]),
      courseId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { generateReportPdf } = await import("./pdfGenerator");
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `relatorio-ppc-${input.type}-${timestamp}.pdf`;
      const generatedAt = new Date().toLocaleString("pt-BR");

      let rows: Array<Record<string, string | number>> = [];
      let columns: Array<{ key: string; label: string; width?: number }> = [];
      let title = "Relatório PPC Digital IFMS";
      let subtitle = "";
      let summary: Array<{ label: string; value: string | number }> = [];

      if (input.type === "by_area") {
        const data = await getClassesByArea();
        title = "Relatório por Área de Ensino";
        subtitle = "Total de aulas e disciplinas por área";
        summary = [
          { label: "Total de Áreas", value: data.length },
          { label: "Total de Aulas/sem", value: data.reduce((s, r) => s + r.totalWeeklyClasses, 0) },
          { label: "Total de Disciplinas", value: data.reduce((s, r) => s + r.subjectCount, 0) },
        ];
        columns = [
          { key: "areaName", label: "Área de Ensino", width: 200 },
          { key: "subjectCount", label: "Disciplinas", width: 100 },
          { key: "totalWeeklyClasses", label: "Aulas/Semana", width: 100 },
        ];
        rows = data.map((r) => ({ areaName: r.areaName, subjectCount: r.subjectCount, totalWeeklyClasses: r.totalWeeklyClasses }));
      } else if (input.type === "by_semester") {
        const data = await getClassesBySemester(input.courseId);
        title = "Relatório por Semestre";
        subtitle = input.courseId ? `Curso #${input.courseId}` : "Todos os cursos";
        summary = [
          { label: "Total de Semestres", value: data.length },
          { label: "Total de Aulas/sem", value: data.reduce((s, r) => s + r.totalClasses, 0) },
        ];
        columns = [
          { key: "semester", label: "Semestre", width: 100 },
          { key: "totalClasses", label: "Aulas/Semana", width: 150 },
        ];
        rows = data.map((r) => ({ semester: `${r.semester}º Semestre`, totalClasses: r.totalClasses }));
      } else if (input.type === "by_course") {
        const data = await getReportByCourse();
        title = "Relatório por Curso";
        subtitle = "Carga horária e disciplinas por curso";
        summary = [
          { label: "Total de Cursos", value: data.length },
          { label: "Total de Disciplinas", value: data.reduce((s, r) => s + r.subjectCount, 0) },
          { label: "Total de Aulas/sem", value: data.reduce((s, r) => s + r.totalWeeklyClasses, 0) },
        ];
        columns = [
          { key: "courseName", label: "Curso", width: 180 },
          { key: "courseType", label: "Tipo", width: 90 },
          { key: "subjectCount", label: "Disciplinas", width: 80 },
          { key: "totalWeeklyClasses", label: "Aulas/sem", width: 80 },
          { key: "withoutArea", label: "Sem Área", width: 65 },
        ];
        rows = data.map((r) => ({ courseName: r.courseName, courseType: r.courseType, subjectCount: r.subjectCount, totalWeeklyClasses: r.totalWeeklyClasses, withoutArea: r.withoutArea }));
      } else {
        const data = await getReportByCampus();
        title = "Relatório por Campus";
        subtitle = "Visão consolidada por unidade";
        summary = [
          { label: "Total de Campus", value: data.length },
          { label: "Total de Cursos", value: data.reduce((s, r) => s + r.courseCount, 0) },
          { label: "Total de Aulas/sem", value: data.reduce((s, r) => s + r.totalWeeklyClasses, 0) },
        ];
        columns = [
          { key: "campusName", label: "Campus", width: 180 },
          { key: "courseCount", label: "Cursos", width: 80 },
          { key: "subjectCount", label: "Disciplinas", width: 80 },
          { key: "totalWeeklyClasses", label: "Aulas/sem", width: 80 },
        ];
        rows = data.map((r) => ({ campusName: r.campusName, courseCount: r.courseCount, subjectCount: r.subjectCount, totalWeeklyClasses: r.totalWeeklyClasses }));
      }

      const pdfBuffer = await generateReportPdf({ title, subtitle, generatedAt, rows, columns, summary });
      const { storagePut: storagePutFn } = await import("./storage");
      const { url } = await storagePutFn(`reports/${fileName}`, pdfBuffer, "application/pdf");
      return { url, fileName };
    }),
});

// ─── Audit Routerer ─────────────────────────────────────────────────────────────
const auditRouter = router({
  list: adminProcedure
    .input(z.object({
      entity: z.string().optional(),
      entityId: z.number().optional(),
      userId: z.number().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(({ input }) => getAuditLogs(input)),
});

// ─── Users Router ─────────────────────────────────────────────────────────────
const usersRouter = router({
  list: adminProcedure.query(() => getAllUsers()),

  updateRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "coordinator", "teacher"]) }))
    .mutation(async ({ input, ctx }) => {
      await updateUserRole(input.userId, input.role);
      await audit(ctx, "UPDATE_ROLE", "user", input.userId, null, { role: input.role });
      return { success: true };
    }),

  assignCourseRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      courseId: z.number().optional(),
      campusId: z.number().optional(),
      role: z.enum(["coordinator", "teacher"]),
    }))
    .mutation(async ({ input, ctx }) => {
      await assignUserCourseRole(input);
      await audit(ctx, "ASSIGN_COURSE_ROLE", "user_course_role", undefined, null, input);
      return { success: true };
    }),

  courseRoles: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserCourseRoles(input.userId)),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  campus: campusRouter,
  areas: areasRouter,
  courses: coursesRouter,
  subjects: subjectsRouter,
  ppc: ppcRouter,
  approval: approvalRouter,
  dashboard: dashboardRouter,
  reports: reportsRouter,
  audit: auditRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
