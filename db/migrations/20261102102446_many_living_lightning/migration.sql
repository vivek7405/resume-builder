CREATE TABLE `resumes` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`template` text DEFAULT 'classic' NOT NULL,
	`accent` text DEFAULT '#1c1b19' NOT NULL,
	`profile` text NOT NULL,
	`experience` text NOT NULL,
	`education` text NOT NULL,
	`projects` text NOT NULL,
	`skills` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
