CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"license_plate" varchar(20) NOT NULL,
	"driver_name" varchar(100) NOT NULL,
	"violation_type" varchar(100) NOT NULL,
	"fine_amount" numeric(10, 2) NOT NULL,
	"date_issued" timestamp DEFAULT now(),
	"is_paid" boolean DEFAULT false NOT NULL
);
