/**
 * Script de inicialização e migração do banco de dados para Railway.
 * Execute: node scripts/init-db.mjs
 *
 * Estratégia:
 *  1. CREATE TABLE IF NOT EXISTS — cria tabelas novas sem afetar as existentes.
 *  2. ALTER TABLE ... ADD COLUMN IF NOT EXISTS — adiciona colunas novas sem destruir dados.
 *  3. CREATE INDEX IF NOT EXISTS — adiciona índices de performance idempotentemente.
 *  4. Constraint UNIQUE via índice — evita duplicatas em campus_areas.
 *
 * Adicione novas migrações ao array MIGRATIONS com um nome descritivo.
 * Nunca remova migrações já executadas — apenas adicione novas ao final.
 */
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada!");
  process.exit(1);
}

// ─── Fase 1: CREATE TABLE IF NOT EXISTS ──────────────────────────────────────
// Cria todas as tabelas na primeira execução. Idempotente.
const CREATE_TABLES = [
  {
    name: "users",
    sql: `CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`openId\` varchar(64) NOT NULL,
      \`name\` text,
      \`email\` varchar(320),
      \`loginMethod\` varchar(64),
      \`role\` enum('user','admin','coordinator','teacher') NOT NULL DEFAULT 'user',
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      \`lastSignedIn\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`users_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`users_openId_unique\` UNIQUE(\`openId\`)
    )`,
  },
  {
    name: "campuses",
    sql: `CREATE TABLE IF NOT EXISTS \`campuses\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`city\` varchar(100),
      \`state\` varchar(2),
      \`active\` boolean NOT NULL DEFAULT true,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`campuses_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "teaching_areas",
    sql: `CREATE TABLE IF NOT EXISTS \`teaching_areas\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`description\` text,
      \`color\` varchar(7) DEFAULT '#3B82F6',
      \`active\` boolean NOT NULL DEFAULT true,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`teaching_areas_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "courses",
    sql: `CREATE TABLE IF NOT EXISTS \`courses\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`type\` enum('Técnico','Subsequente','Graduação','FIC','Pós-graduação') NOT NULL,
      \`campusId\` int NOT NULL,
      \`coordinatorId\` int,
      \`duration\` int NOT NULL DEFAULT 6,
      \`classesFirstHalfYear\` int NOT NULL DEFAULT 1,
      \`classesSecondHalfYear\` int NOT NULL DEFAULT 0,
      \`active\` boolean NOT NULL DEFAULT true,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`courses_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "subjects",
    sql: `CREATE TABLE IF NOT EXISTS \`subjects\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`courseId\` int NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`semester\` int NOT NULL,
      \`weeklyClasses\` int NOT NULL DEFAULT 2,
      \`totalHours\` int,
      \`areaId\` int,
      \`isElective\` boolean NOT NULL DEFAULT false,
      \`isRemote\` boolean NOT NULL DEFAULT false,
      \`syllabus\` text,
      \`bibliography\` text,
      \`active\` boolean NOT NULL DEFAULT true,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`subjects_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "ppc_documents",
    sql: `CREATE TABLE IF NOT EXISTS \`ppc_documents\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`courseId\` int,
      \`campusId\` int,
      \`fileName\` varchar(255) NOT NULL,
      \`fileUrl\` text NOT NULL,
      \`fileKey\` varchar(500) NOT NULL,
      \`status\` enum('pending','processing','extracted','approved','rejected') NOT NULL DEFAULT 'pending',
      \`extractedData\` json,
      \`uploadedBy\` int NOT NULL,
      \`processedAt\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`ppc_documents_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "approval_requests",
    sql: `CREATE TABLE IF NOT EXISTS \`approval_requests\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`subjectId\` int NOT NULL,
      \`courseId\` int NOT NULL,
      \`requestedBy\` int NOT NULL,
      \`assignedTo\` int,
      \`status\` enum('pending','responded','approved','rejected') NOT NULL DEFAULT 'pending',
      \`suggestedAreaId\` int,
      \`adminNotes\` text,
      \`coordinatorNotes\` text,
      \`respondedAt\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`approval_requests_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "audit_logs",
    sql: `CREATE TABLE IF NOT EXISTS \`audit_logs\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int,
      \`userEmail\` varchar(320),
      \`userName\` varchar(255),
      \`action\` varchar(100) NOT NULL,
      \`entity\` varchar(100) NOT NULL,
      \`entityId\` int,
      \`oldValue\` json,
      \`newValue\` json,
      \`ipAddress\` varchar(45),
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`audit_logs_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "user_course_roles",
    sql: `CREATE TABLE IF NOT EXISTS \`user_course_roles\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`courseId\` int,
      \`campusId\` int,
      \`role\` enum('coordinator','teacher') NOT NULL,
      \`active\` boolean NOT NULL DEFAULT true,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`user_course_roles_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "course_offerings",
    sql: `CREATE TABLE IF NOT EXISTS \`course_offerings\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`courseId\` int NOT NULL,
      \`campusId\` int NOT NULL,
      \`academicTerm\` varchar(10) NOT NULL,
      \`selectionNotice\` varchar(500),
      \`numberOfEntries\` int NOT NULL DEFAULT 1,
      \`active\` boolean NOT NULL DEFAULT true,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`course_offerings_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "campus_areas",
    sql: `CREATE TABLE IF NOT EXISTS \`campus_areas\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`campusId\` int NOT NULL,
      \`areaId\` int NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`campus_areas_id\` PRIMARY KEY(\`id\`)
    )`,
  },
];

// ─── Fase 2: Migrações incrementais ──────────────────────────────────────────
// Cada migração é idempotente. Adicione novas entradas ao FINAL do array.
// NUNCA remova ou reordene migrações existentes.
const MIGRATIONS = [
  // v1.0 — Índices de performance (2026-04)
  {
    name: "idx_subjects_courseId",
    sql: `ALTER TABLE \`subjects\` ADD INDEX \`idx_subjects_courseId\` (\`courseId\`)`,
    checkSql: `SELECT COUNT(*) as cnt FROM information_schema.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subjects'
               AND INDEX_NAME = 'idx_subjects_courseId'`,
  },
  {
    name: "idx_subjects_areaId",
    sql: `ALTER TABLE \`subjects\` ADD INDEX \`idx_subjects_areaId\` (\`areaId\`)`,
    checkSql: `SELECT COUNT(*) as cnt FROM information_schema.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subjects'
               AND INDEX_NAME = 'idx_subjects_areaId'`,
  },
  {
    name: "idx_courses_campusId",
    sql: `ALTER TABLE \`courses\` ADD INDEX \`idx_courses_campusId\` (\`campusId\`)`,
    checkSql: `SELECT COUNT(*) as cnt FROM information_schema.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'courses'
               AND INDEX_NAME = 'idx_courses_campusId'`,
  },
  {
    // Deduplicar campus_areas ANTES de criar o índice UNIQUE.
    // Mantém apenas o registro mais antigo (menor id) de cada par (campusId, areaId).
    name: "dedup_campus_areas",
    sql: `DELETE ca1 FROM \`campus_areas\` ca1
          INNER JOIN \`campus_areas\` ca2
          WHERE ca1.campusId = ca2.campusId AND ca1.areaId = ca2.areaId AND ca1.id > ca2.id`,
    checkSql: `SELECT COUNT(*) as cnt FROM information_schema.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campus_areas'
               AND INDEX_NAME = 'idx_campus_areas_unique'`,
    // Se o índice UNIQUE já existir, a deduplicação não é necessária
    skipIfCheckPositive: true,
  },
  {
    name: "idx_campus_areas_unique",
    sql: `ALTER TABLE \`campus_areas\` ADD UNIQUE INDEX \`idx_campus_areas_unique\` (\`campusId\`, \`areaId\`)`,
    checkSql: `SELECT COUNT(*) as cnt FROM information_schema.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campus_areas'
               AND INDEX_NAME = 'idx_campus_areas_unique'`,
  },
  // v1.1 — Adicione novas migrações abaixo desta linha
  // Exemplo:
  // {
  //   name: "add_subjects_order_column",
  //   sql: `ALTER TABLE \`subjects\` ADD COLUMN \`displayOrder\` int NOT NULL DEFAULT 0`,
  //   checkSql: `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
  //              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subjects'
  //              AND COLUMN_NAME = 'displayOrder'`,
  // },
];

// ─── Runner ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔌 Conectando ao banco de dados...");
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log("✅ Conectado!\n");

  // Fase 1: Criar tabelas
  console.log("📋 Fase 1: Criando tabelas (se não existirem)...");
  for (const { name, sql } of CREATE_TABLES) {
    try {
      await connection.execute(sql);
      console.log(`  ✓ Tabela '${name}' OK`);
    } catch (err) {
      console.error(`  ✗ Erro na tabela '${name}':`, err.message);
      // Não interrompe — outras tabelas podem ser criadas normalmente
    }
  }

  // Fase 2: Migrações incrementais
  console.log("\n🔄 Fase 2: Aplicando migrações incrementais...");
  for (const { name, sql, checkSql, skipIfCheckPositive } of MIGRATIONS) {
    try {
      // Verificar se a migração já foi aplicada (ou deve ser pulada se condição já é verdadeira)
      const [rows] = await connection.execute(checkSql);
      const count = Number(rows[0]?.cnt ?? 0);
      if (count > 0) {
        if (skipIfCheckPositive) {
          console.log(`  ⏭  Migração '${name}' pulada (condição já satisfeita)`);
        } else {
          console.log(`  ⏭  Migração '${name}' já aplicada, pulando`);
        }
        continue;
      }
      // Aplicar migração
      await connection.execute(sql);
      console.log(`  ✓ Migração '${name}' aplicada com sucesso`);
    } catch (err) {
      // Logar o erro mas continuar — migrações subsequentes podem ser independentes.
      // Em produção, monitore os logs de boot para detectar falhas de migração.
      console.error(`  ✗ Erro na migração '${name}':`, err.message);
    }
  }

  await connection.end();
  console.log("\n🎉 Banco de dados inicializado e migrado com sucesso!");
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
