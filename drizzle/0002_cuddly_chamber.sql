CREATE TABLE `contentDrafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme` varchar(160) NOT NULL,
	`content` text NOT NULL,
	`status` enum('draft','approved','rejected') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentDrafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoredAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountName` varchar(160) NOT NULL,
	`handle` varchar(80) NOT NULL,
	`category` varchar(120) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monitoredAccounts_id` PRIMARY KEY(`id`)
);
