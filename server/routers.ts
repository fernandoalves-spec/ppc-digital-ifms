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
  findOrCreateCampus,
  findOrCreateCourse,
  findAreaInCampus,
  getCampusAreas,
  addAreaToCampus,
  removeAreaFromCampus,
  setCampusAreas,
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
  getMemoryByArea,
  getSubjectsByCourse,
  getSubjectsByIds,
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
  getOfferings,
  createOffering,
  updateOffering,
  deleteOffering,
  getClassesByAreaFromOfferings,
  getClassesBySemesterFromOfferings,
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
  // ─── Vínculo Campus ↔ Áreas
  getAreas: publicProcedure
    .input(z.object({ campusId: z.number() }))
    .query(({ input }) => getCampusAreas(input.campusId)),
  setAreas: adminProcedure
    .input(z.object({ campusId: z.number(), areaIds: z.array(z.number()) }))
    .mutation(async ({ input, ctx }) => {
      await setCampusAreas(input.campusId, input.areaIds);
      await audit(ctx, "SET_AREAS", "campus", input.campusId, null, { areaIds: input.areaIds });
      return { success: true };
    }),
  addArea: adminProcedure
    .input(z.object({ campusId: z.number(), areaId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await addAreaToCampus(input.campusId, input.areaId);
      await audit(ctx, "ADD_AREA", "campus", input.campusId, null, { areaId: input.areaId });
      return { success: true };
    }),
  removeArea: adminProcedure
    .input(z.object({ campusId: z.number(), areaId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await removeAreaFromCampus(input.campusId, input.areaId);
      await audit(ctx, "REMOVE_AREA", "campus", input.campusId, null, { areaId: input.areaId });
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

  getByIds: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .query(({ input }) => getSubjectsByIds(input.ids)),

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
      syllabus: z.string().optional(),
      bibliography: z.string().optional(),
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
      totalHours: z.number().nullable().optional(),
      areaId: z.number().nullable().optional(),
      isElective: z.boolean().optional(),
      isRemote: z.boolean().optional(),
      active: z.boolean().optional(),
      syllabus: z.string().nullable().optional(),
      bibliography: z.string().nullable().optional(),
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
    .input(z.object({ documentId: z.number(), fileUrl: z.string(), campusId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      await updatePpcDocument(input.documentId, { status: "processing" });
      try {
        // Buscar áreas vinculadas ao campus (se informado) para guiar a IA
        let campusAreaNames: string[] = [];
        if (input.campusId) {
          const areas = await getCampusAreas(input.campusId);
          campusAreaNames = areas.map(a => a.name);
        }
        // Baixar o PDF e extrair texto com pdf-parse v2
        const pdfResponse = await fetch(input.fileUrl);
        if (!pdfResponse.ok) throw new Error(`Falha ao baixar PDF: ${pdfResponse.status}`);
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: pdfBuffer });
        const textResult = await parser.getText();
        const pdfText = textResult.pages.map((p: any) => p.text || "").join("\n");

        if (!pdfText || pdfText.trim().length < 100) {
          throw new Error("O PDF não contém texto extraível suficiente. Verifique se o arquivo é um PPC válido.");
        }

        // Truncar texto se muito longo (limite seguro para o LLM)
        const maxChars = 120000;
        const truncatedText = pdfText.length > maxChars ? pdfText.substring(0, maxChars) + "\n[... texto truncado ...]" : pdfText;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em análise de Projetos Pedagógicos de Curso (PPC) de institutos federais brasileiros.
Analise o texto extraído do documento PPC e extraia TODAS as informações em formato JSON estruturado.

Para cada disciplina/unidade curricular, extraia:
1. name: nome completo da disciplina
2. semester: semestre em que é ofertada (inteiro, 1 a 12)
3. weeklyClasses: número de aulas semanais (inteiro). Se não encontrar explicitamente, calcule dividindo a carga horária semanal ou estime com base na carga horária total e semanas letivas (tipicamente 20 semanas). Se não for possível, use 2.
4. totalHours: carga horária total em horas (inteiro ou null)
5. isElective: se é optativa/eletiva (boolean)
6. isRemote: se é EaD/remota (boolean)
7. suggestedArea: área de conhecimento da disciplina. ${campusAreaNames.length > 0 ? `IMPORTANTE: Use APENAS um dos seguintes nomes de área (exatamente como escrito): ${campusAreaNames.map(n => `"${n}"`).join(", ")}. Se a disciplina não se encaixar claramente em nenhuma dessas áreas, use "Não identificada".` : `Classifique baseado no conteúdo. Se não identificar, use "Não identificada".`}
8. syllabus: ementa completa da disciplina (texto do PPC, ou null se não encontrar)
9. bibliography: referências bibliográficas (básica e complementar, texto do PPC, ou null se não encontrar)

IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional, sem markdown.`,
            },
            {
              role: "user",
              content: `Extraia TODAS as informações do PPC abaixo: curso (nome e tipo) e para cada disciplina extraia também a ementa e referências bibliográficas completas. O campus já foi informado pelo usuário, NÃO é necessário extrair o campus.\n\n--- TEXTO DO PPC ---\n${truncatedText}`,
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
                  courseName: { type: "string", description: "Nome completo do curso" },
                  courseType: { type: "string", description: "Tipo: Técnico, Subsequente, Graduação, FIC ou Pós-graduação" },
                  duration: { type: "integer", description: "Duração em semestres" },
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
                        suggestedArea: { type: "string" },
                        syllabus: { type: ["string", "null"] },
                        bibliography: { type: ["string", "null"] },
                      },
                      required: ["name", "semester", "weeklyClasses", "isElective", "isRemote", "suggestedArea", "syllabus", "bibliography"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["courseName", "courseType", "duration", "subjects"],
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
        console.error("[PPC Extract Error]", error);
        await updatePpcDocument(input.documentId, { status: "rejected" });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro na extração: ${error.message}` });
      }
    }),
  applyExtraction: adminProcedure
    .input(z.object({
      documentId: z.number(),
      // campusId é definido pelo usuário e não pode ser alterado pela IA
      campusId: z.number(),
      courseName: z.string(),
      courseType: z.string(),
      duration: z.number().optional(),
      subjects: z.array(z.object({
        name: z.string(),
        semester: z.number(),
        weeklyClasses: z.number(),
        totalHours: z.number().optional().nullable(),
        isElective: z.boolean(),
        isRemote: z.boolean(),
        suggestedArea: z.string().optional(),
        syllabus: z.string().optional().nullable(),
        bibliography: z.string().optional().nullable(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      // Campus é imutável: usa sempre o campusId definido pelo usuário no upload
      const campusId = input.campusId;
      // Auto-cadastrar curso se não existir
      const courseId = await findOrCreateCourse({
        name: input.courseName,
        type: input.courseType,
        campusId,
        duration: input.duration,
      });
      // Criar disciplinas com área automática (apenas áreas vinculadas ao campus), ementa e referências
      let createdCount = 0;
      for (const subject of input.subjects) {
        // Busca a área apenas entre as vinculadas ao campus; se não encontrar, deixa sem área
        const areaId = subject.suggestedArea
          ? await findAreaInCampus(campusId, subject.suggestedArea)
          : null;
        await createSubject({
          courseId,
          name: subject.name,
          semester: subject.semester,
          weeklyClasses: subject.weeklyClasses,
          totalHours: subject.totalHours ?? undefined,
          isElective: subject.isElective,
          isRemote: subject.isRemote,
          areaId: areaId ?? undefined,
          syllabus: subject.syllabus ?? undefined,
          bibliography: subject.bibliography ?? undefined,
        });
        createdCount++;
      }
      await updatePpcDocument(input.documentId, { status: "approved", courseId });
      await audit(ctx, "APPLY_EXTRACTION", "ppc_document", input.documentId, null, {
        campusId: input.campusId,
        courseName: input.courseName,
        subjectCount: createdCount,
        autoCreated: true,
      });
      return { success: true, campusId, courseId };
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
      // Buscar a solicitação ANTES de alterar o status
      const allRequests = await getApprovalRequests();
      const req = allRequests.find((r) => r.id === id);
      await respondApprovalRequest(id, data);
      // Atualizar a área da disciplina quando aprovado/respondido
      if ((data.status === "responded" || data.status === "approved") && req) {
        await updateSubject(req.subjectId, { areaId: data.suggestedAreaId });
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
  memoryByArea: protectedProcedure
    .input(z.object({
      campusId: z.number().optional(),
      areaId: z.number().optional(),
    }).optional())
    .query(({ input }) => getMemoryByArea(input ?? {})),
  exportMemoryPdf: protectedProcedure
    .input(z.object({
      campusId: z.number().optional(),
      areaId: z.number().optional(),
    }).optional())
    .mutation(async ({ input }) => {
      const { generateMemoryPdf } = await import("./pdfGenerator");
      const data = await getMemoryByArea(input ?? {});
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `memoria-calculo-${timestamp}.pdf`;
      const pdfBuffer = await generateMemoryPdf({ data, generatedAt: new Date().toLocaleString("pt-BR") });
      const { storagePut: storagePutFn } = await import("./storage");
      const { url } = await storagePutFn(`reports/${fileName}`, pdfBuffer, "application/pdf");
      return { url, fileName };
    }),

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

// ─── Audit Router ─────────────────────────────────────────────────────────────
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

// ─── Offerings Router (Quadro de Oferta) ─────────────────────────────────────
const offeringsRouter = router({
  list: protectedProcedure
    .input(z.object({ campusId: z.number().optional(), courseId: z.number().optional() }).optional())
    .query(({ input }) => getOfferings(input ?? {})),

  create: protectedProcedure
    .input(z.object({
      courseId: z.number(),
      campusId: z.number(),
      academicTerm: z.string().regex(/^\d{4}\/[12]$/, "Formato inválido. Use AAAA/1 ou AAAA/2"),
      selectionNotice: z.string().optional(),
      numberOfEntries: z.number().min(1).default(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await createOffering(input);
      await createAuditLog({
        userId: ctx.user.id,
        userEmail: ctx.user.email ?? "",
        userName: ctx.user.name ?? "",
        action: "CREATE",
        entity: "offering",
        entityId: result.id,
        newValue: input,
      });
      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      selectionNotice: z.string().nullable().optional(),
      numberOfEntries: z.number().min(1).optional(),
      academicTerm: z.string().regex(/^\d{4}\/[12]$/).optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateOffering(id, data);
      await createAuditLog({
        userId: ctx.user.id,
        userEmail: ctx.user.email ?? "",
        userName: ctx.user.name ?? "",
        action: "UPDATE",
        entity: "offering",
        entityId: id,
        newValue: data,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteOffering(input.id);
      await createAuditLog({
        userId: ctx.user.id,
        userEmail: ctx.user.email ?? "",
        userName: ctx.user.name ?? "",
        action: "DELETE",
        entity: "offering",
        entityId: input.id,
      });
      return { success: true };
    }),

  classesByArea: protectedProcedure.query(() => getClassesByAreaFromOfferings()),
  classesBySemester: protectedProcedure.query(() => getClassesBySemesterFromOfferings()),
});

// ─── App Router ─────────────────────────────────────────────────────────────────────
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
  offerings: offeringsRouter,
});

export type AppRouter = typeof appRouter;
