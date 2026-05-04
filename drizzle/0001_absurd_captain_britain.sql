CREATE TABLE `nexed_suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact_person` text,
	`phone` text,
	`email` text,
	`category` text,
	`tenant_id` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_nexed_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text,
	`supplier_id` text,
	`votehead_id` text,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`method` text NOT NULL,
	`reference` text,
	`description` text,
	`tenant_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `nexed_students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `nexed_suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`votehead_id`) REFERENCES `nexed_voteheads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_nexed_transactions`("id", "student_id", "supplier_id", "votehead_id", "amount", "type", "method", "reference", "description", "tenant_id", "created_at") SELECT "id", "student_id", NULL, "votehead_id", "amount", "type", "method", "reference", "description", "tenant_id", "created_at" FROM `nexed_transactions`;
--> statement-breakpoint
DROP TABLE `nexed_transactions`;--> statement-breakpoint
ALTER TABLE `__new_nexed_transactions` RENAME TO `nexed_transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `nexed_transactions_reference_unique` ON `nexed_transactions` (`reference`);