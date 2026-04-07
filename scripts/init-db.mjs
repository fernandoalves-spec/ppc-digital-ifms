/**
 * Script de inicialização do banco de dados para Railway
 * Execute: node scripts/init-db.mjs
 * 
 * Este script cria todas as tabelas necessárias se ainda não existirem.
 */
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada!");
  process.exit(1);
}

const SQL_STATEMENTS = [
  // Tabela de usuários
  `CREATE TABLE IF NOT EXISTS \`users\` (
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

  // Tabela de campus
  `CREATE TABLE IF NOT EXISTS \`campuses\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`city\` varchar(100),
    \`state\` varchar(2),
    \`active\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`campuses_id\` PRIMARY KEY(\`id\`)
  )`,

  // Tabela de áreas de ensino
  `CREATE TABLE IF NOT EXISTS \`teaching_areas\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`description\` text,
    \`color\` varchar(7) DEFAULT '#3B82F6',
    \`active\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`teaching_areas_id\` PRIMARY KEY(\`id\`)
  )`,

  // Tabela de cursos
  `CREATE TABLE IF NOT EXISTS \`courses\` (
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

  // Tabela de disciplinas
  `CREATE TABLE IF NOT EXISTS \`subjects\` (
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

  // Tabela de documentos PPC
  `CREATE TABLE IF NOT EXISTS \`ppc_documents\` (
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

  // Tabela de solicitações de aprovação
  `CREATE TABLE IF NOT EXISTS \`approval_requests\` (
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

  // Tabela de logs de auditoria
  `CREATE TABLE IF NOT EXISTS \`audit_logs\` (
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

  // Tabela de papéis de usuário por curso
  `CREATE TABLE IF NOT EXISTS \`user_course_roles\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`courseId\` int,
    \`campusId\` int,
    \`role\` enum('coordinator','teacher') NOT NULL,
    \`active\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`user_course_roles_id\` PRIMARY KEY(\`id\`)
  )`,

  // Tabela de ofertas de cursos
  `CREATE TABLE IF NOT EXISTS \`course_offerings\` (
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

  // Tabela de áreas por campus
  `CREATE TABLE IF NOT EXISTS \`campus_areas\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`campusId\` int NOT NULL,
    \`areaId\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`campus_areas_id\` PRIMARY KEY(\`id\`)
  )`,
];

async function main() {
  console.log("🔌 Conectando ao banco de dados...");
  const connection = await mysql.createConnection(DATABASE_URL);

  console.log("✅ Conectado! Criando tabelas...");
  for (const sql of SQL_STATEMENTS) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `([^`]+)`/)?.[1];
    try {
      await connection.execute(sql);
      console.log(`  ✓ Tabela '${tableName}' OK`);
    } catch (err) {
      console.error(`  ✗ Erro na tabela '${tableName}':`, err.message);
    }
  }

  await connection.end();
  console.log("\n🎉 Banco de dados inicializado com sucesso!");
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
