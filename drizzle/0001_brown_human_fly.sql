CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`targetAudience` text NOT NULL,
	`status` enum('draft','scheduled','active','paused') NOT NULL DEFAULT 'draft',
	`leadCount` int NOT NULL DEFAULT 0,
	`contactedCount` int NOT NULL DEFAULT 0,
	`replyCount` int NOT NULL DEFAULT 0,
	`qualifiedCount` int NOT NULL DEFAULT 0,
	`dailyLimit` int NOT NULL DEFAULT 30,
	`scheduledFor` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversationMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`sender` enum('contact','agent','human') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversationMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`contactName` varchar(160) NOT NULL,
	`contactHandle` varchar(80) NOT NULL,
	`preview` text NOT NULL,
	`intent` enum('Interested','Partner','Investor','General','Not Interested','Spam','Needs Human') NOT NULL DEFAULT 'General',
	`status` enum('open','escalated','closed') NOT NULL DEFAULT 'open',
	`escalationReason` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeBaseEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('company','product','vision','faq','tone','restricted') NOT NULL,
	`title` varchar(160) NOT NULL,
	`content` text NOT NULL,
	`isRestricted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeBaseEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`handle` varchar(80) NOT NULL,
	`category` varchar(120) NOT NULL,
	`bio` text,
	`location` varchar(120),
	`audienceSize` int NOT NULL DEFAULT 0,
	`relevance` int NOT NULL DEFAULT 0,
	`interestLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`leadScore` int NOT NULL DEFAULT 0,
	`opportunityTag` enum('potential user','partner','investor','KOL'),
	`status` enum('new','contacted','replied','qualified','human_follow_up') NOT NULL DEFAULT 'new',
	`verified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `replyDrafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetName` varchar(160) NOT NULL,
	`targetHandle` varchar(80) NOT NULL,
	`sourcePost` text NOT NULL,
	`draft` text NOT NULL,
	`status` enum('draft','approved','rejected') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `replyDrafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safetyControls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`outreachDmsPerDay` int NOT NULL DEFAULT 30,
	`repliesPerHour` int NOT NULL DEFAULT 12,
	`postsPerDay` int NOT NULL DEFAULT 2,
	`outreachMode` enum('Manual','Semi-autonomous','Autonomous') NOT NULL DEFAULT 'Manual',
	`conversationMode` enum('Manual','Semi-autonomous','Autonomous') NOT NULL DEFAULT 'Manual',
	`replyMode` enum('Manual','Semi-autonomous','Autonomous') NOT NULL DEFAULT 'Manual',
	`autoPauseThreshold` int NOT NULL DEFAULT 85,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `safetyControls_id` PRIMARY KEY(`id`),
	CONSTRAINT `safetyControls_userId_unique` UNIQUE(`userId`)
);
