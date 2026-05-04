CREATE TABLE `nexed_mpesa_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_number` text,
	`amount` integer,
	`receipt` text,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `nexed_pending_reconciliation` (
	`id` text PRIMARY KEY NOT NULL,
	`mpesa_log_id` text,
	`amount` integer NOT NULL,
	`phone_number` text NOT NULL,
	`receipt` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open',
	`created_at` integer,
	FOREIGN KEY (`mpesa_log_id`) REFERENCES `nexed_mpesa_logs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nexed_students` (
	`id` text PRIMARY KEY NOT NULL,
	`adm` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`metadata` text,
	`tenant_id` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nexed_students_adm_unique` ON `nexed_students` (`adm`);--> statement-breakpoint
CREATE TABLE `nexed_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`votehead_id` text,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`method` text NOT NULL,
	`reference` text,
	`description` text,
	`tenant_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `nexed_students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`votehead_id`) REFERENCES `nexed_voteheads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nexed_transactions_reference_unique` ON `nexed_transactions` (`reference`);--> statement-breakpoint
CREATE TABLE `nexed_voteheads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`tenant_id` text NOT NULL
);
