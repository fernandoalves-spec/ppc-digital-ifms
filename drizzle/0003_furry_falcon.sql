CREATE TABLE `course_offerings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`campusId` int NOT NULL,
	`academicTerm` varchar(10) NOT NULL,
	`selectionNotice` varchar(500),
	`numberOfEntries` int NOT NULL DEFAULT 1,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_offerings_id` PRIMARY KEY(`id`)
);
