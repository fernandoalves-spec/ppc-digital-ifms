CREATE TABLE `campus_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`areaId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campus_areas_id` PRIMARY KEY(`id`)
);
