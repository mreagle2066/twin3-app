CREATE TABLE `xAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`xUserId` varchar(80) NOT NULL,
	`username` varchar(100) NOT NULL,
	`displayName` varchar(160),
	`accessTokenCiphertext` text NOT NULL,
	`refreshTokenCiphertext` text,
	`scopes` text NOT NULL,
	`tokenExpiresAt` timestamp,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `xAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `xAccounts_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `xAccounts_xUserId_unique` UNIQUE(`xUserId`)
);
