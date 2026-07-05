CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ruleId` int NOT NULL,
	`messageId` varchar(255) NOT NULL,
	`contact` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`matchedKeyword` varchar(255) NOT NULL,
	`sentResponse` text NOT NULL,
	`status` enum('success','failed') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`response` text NOT NULL,
	`matchType` enum('exact','contains','startsWith','endsWith') NOT NULL DEFAULT 'contains',
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`messageId` varchar(255) NOT NULL,
	`sender` varchar(255) NOT NULL,
	`senderName` varchar(255),
	`content` text NOT NULL,
	`direction` enum('incoming','outgoing') NOT NULL,
	`timestamp` bigint NOT NULL,
	`isAutomated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(20),
	`status` enum('disconnected','connecting','connected','error') NOT NULL DEFAULT 'disconnected',
	`sessionData` text,
	`qrCode` text,
	`lastConnectedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_connections_id` PRIMARY KEY(`id`)
);
