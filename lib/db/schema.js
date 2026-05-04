import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const students = sqliteTable('nexed_students', {
  id: text('id').primaryKey(),
  adm: text('adm').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  metadata: text('metadata', { mode: 'json' }), // For flexible account matching
  tenantId: text('tenant_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const voteheads = sqliteTable('nexed_voteheads', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  tenantId: text('tenant_id').notNull(),
});

export const suppliers = sqliteTable('nexed_suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  category: text('category'), // e.g. "Food", "Stationery"
  tenantId: text('tenant_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const transactions = sqliteTable('nexed_transactions', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => students.id), // Optional for non-student tx
  supplierId: text('supplier_id').references(() => suppliers.id), // For expenditures
  voteheadId: text('votehead_id').references(() => voteheads.id),
  amount: integer('amount').notNull(), 
  type: text('type', { enum: ['credit', 'debit', 'reversal', 'expenditure'] }).notNull(),
  method: text('method', { enum: ['mpesa', 'cash', 'cheque', 'bank_transfer', 'system'] }).notNull(),
  reference: text('reference').unique(), 
  description: text('description'),
  tenantId: text('tenant_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const mpesaLogs = sqliteTable('nexed_mpesa_logs', {
  id: text('id').primaryKey(),
  phoneNumber: text('phone_number'),
  amount: integer('amount'),
  receipt: text('receipt'),
  payload: text('payload', { mode: 'json' }).notNull(),
  status: text('status', { enum: ['processed', 'pending', 'failed'] }).default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const pendingReconciliation = sqliteTable('nexed_pending_reconciliation', {
  id: text('id').primaryKey(),
  mpesaLogId: text('mpesa_log_id').references(() => mpesaLogs.id),
  amount: integer('amount').notNull(),
  phoneNumber: text('phone_number').notNull(),
  receipt: text('receipt').notNull(),
  reason: text('reason').notNull(), // e.g., "Student not found"
  status: text('status', { enum: ['open', 'resolved'] }).default('open'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
