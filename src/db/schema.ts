import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').default(''),
  role: text('role').default('admin').notNull(), // 'admin', 'staff', 'agent'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Showrooms table
export const showrooms = pgTable('showrooms', {
  id: serial('id').primaryKey(),
  showroomId: text('showroom_id').notNull().unique(),
  name: text('name').notNull(),
  contactPerson: text('contact_person').default('').notNull(),
  mobileNumber: text('mobile_number').notNull(),
  email: text('email').default(''),
  address: text('address').default('').notNull(),
  dealershipType: text('dealership_type').default('all').notNull(), // 'all', 'tractor', 'car', 'two_wheeler'
  notes: text('notes').default(''),
  status: text('status').default('active').notNull(), // 'active', 'archived'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Clients table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').notNull().unique(),
  fullName: text('full_name').notNull(),
  mobileNumber: text('mobile_number').notNull(),
  alternateMobile: text('alternate_mobile').default(''),
  address: text('address').notNull(),
  aadhaarLastFour: text('aadhaar_last_four').default(''), // Masked last 4 digits (e.g. XXXX-XXXX-1234)
  aadhaarDocUrl: text('aadhaar_doc_url').default(''),
  photoUrl: text('photo_url').default(''),
  notes: text('notes').default(''),
  status: text('status').default('active').notNull(), // 'active', 'archived'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Vehicles table (supports Cars, 2-Wheelers, Commercial, and Tractors)
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().unique(),
  registrationNumber: text('registration_number').default(''), // Unregistered vehicles allowed
  vehicleType: text('vehicle_type').notNull(), // 'tractor', '2_wheeler', '4_wheeler', 'commercial', 'transport', 'electric'
  category: text('category').notNull(), // 'new', 'used'
  manufacturer: text('manufacturer').notNull(),
  model: text('model').notNull(),
  manufacturingYear: integer('manufacturing_year').notNull(),
  chassisNumber: text('chassis_number').notNull(),
  engineNumber: text('engine_number').notNull(),
  fuelType: text('fuel_type').notNull(), // 'diesel', 'petrol', 'electric', 'cng', 'hybrid'
  horsePower: text('horse_power').default(''), // e.g. "45 HP", "50 HP"
  vehicleClass: text('vehicle_class').default(''), // 'Agricultural Tractor', 'Commercial Tractor', 'Trailer Attached', etc.
  isTractor: boolean('is_tractor').default(false).notNull(),
  ownerName: text('owner_name').notNull(),
  ownerMobile: text('owner_mobile').notNull(),
  clientId: integer('client_id').references(() => clients.id),
  showroomId: integer('showroom_id').references(() => showrooms.id),
  qrCode: text('qr_code').default(''),
  notes: text('notes').default(''),
  insurancePolicyNo: text('insurance_policy_no').default(''),
  insuranceExpiryDate: text('insurance_expiry_date').default(''), // YYYY-MM-DD
  tempRegNumber: text('temp_reg_number').default(''),
  tempRegExpiryDate: text('temp_reg_expiry_date').default(''), // YYYY-MM-DD
  fitnessExpiryDate: text('fitness_expiry_date').default(''),
  pucExpiryDate: text('puc_expiry_date').default(''),
  status: text('status').default('active').notNull(), // 'active', 'archived', 'transferred'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Exchange cases table
export const exchangeCases = pgTable('exchange_cases', {
  id: serial('id').primaryKey(),
  exchangeId: text('exchange_id').notNull().unique(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  showroomId: integer('showroom_id').references(() => showrooms.id).notNull(),
  oldVehicleId: integer('old_vehicle_id').references(() => vehicles.id).notNull(),
  newVehicleId: integer('new_vehicle_id').references(() => vehicles.id).notNull(),
  isTractorExchange: boolean('is_tractor_exchange').default(false).notNull(),
  oldOwnerName: text('old_owner_name').notNull(),
  oldOwnerMobile: text('old_owner_mobile').notNull(),
  newOwnerName: text('new_owner_name').notNull(),
  newOwnerMobile: text('new_owner_mobile').notNull(),
  transferStatus: text('transfer_status').default('pending').notNull(), // 'pending', 'submitted_to_rto', 'approved', 'completed'
  newRegStatus: text('new_reg_status').default('pending').notNull(), // 'pending', 'docs_collected', 'submitted_to_rto', 'approved', 'completed'
  handoverPaperworkStatus: text('handover_paperwork_status').default('pending').notNull(), // 'pending', 'signed', 'completed'
  pendingSignatures: text('pending_signatures').default(''),
  qrCode: text('qr_code').default(''),
  notes: text('notes').default(''),
  status: text('status').default('active').notNull(), // 'active', 'completed', 'cancelled'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RTO Cases table
export const rtoCases = pgTable('rto_cases', {
  id: serial('id').primaryKey(),
  caseId: text('case_id').notNull().unique(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  vehicleId: integer('vehicle_id').references(() => vehicles.id).notNull(),
  showroomId: integer('showroom_id').references(() => showrooms.id),
  serviceType: text('service_type').notNull(), // 'new_registration', 'ownership_transfer', 'hypothecation_addition', 'hypothecation_termination', 'duplicate_rc', 'rc_renewal', 'address_change', 'insurance_update', 'noc_processing', 'other'
  rtoOffice: text('rto_office').notNull(), // e.g. 'KA-01 Bangalore Central (Koramangala)'
  applicationNumber: text('application_number').default(''),
  assignedStaff: text('assigned_staff').default(''),
  status: text('status').default('pending').notNull(), // 'pending', 'in_progress', 'waiting_for_documents', 'completed', 'cancelled'
  dueDate: text('due_date').default(''), // YYYY-MM-DD
  completionDate: text('completion_date').default(''), // YYYY-MM-DD
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Case Checklists table
export const caseChecklists = pgTable('case_checklists', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id').references(() => rtoCases.id).notNull(),
  itemKey: text('item_key').notNull(),
  itemLabel: text('item_label').notNull(),
  itemLabelKn: text('item_label_kn').default(''),
  isMandatory: boolean('is_mandatory').default(true).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  verifiedBy: text('verified_by').default(''),
  verifiedAt: timestamp('verified_at'),
  notes: text('notes').default(''),
});

// Documents table
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  docId: text('doc_id').notNull().unique(),
  clientId: integer('client_id').references(() => clients.id),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  showroomId: integer('showroom_id').references(() => showrooms.id),
  caseId: integer('case_id').references(() => rtoCases.id),
  exchangeCaseId: integer('exchange_case_id').references(() => exchangeCases.id),
  docType: text('doc_type').notNull(), // 'rc', 'insurance', 'temp_registration', 'form_20', 'form_21', 'form_22', 'showroom_invoice', 'noc', 'form_35', 'hypothecation', 'aadhaar', 'client_photo', 'handover_receipt', 'other'
  title: text('title').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(), // 'image/jpeg', 'image/png', 'application/pdf'
  fileSize: integer('file_size').notNull(),
  fileData: text('file_data').notNull(), // Secure base64 data URI stored in DB
  version: integer('version').default(1).notNull(),
  tags: text('tags').default(''),
  notes: text('notes').default(''),
  ocrExtractedData: text('ocr_extracted_data').default(''),
  ocrVerified: boolean('ocr_verified').default(false).notNull(),
  uploadedBy: text('uploaded_by').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reminders table
export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  reminderType: text('reminder_type').notNull(), // 'insurance_expiry', 'temp_reg_expiry', 'pending_work', 'missing_docs', 'pending_signatures', 'due_date'
  targetDate: text('target_date').notNull(), // YYYY-MM-DD
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  clientId: integer('client_id').references(() => clients.id),
  caseId: integer('case_id').references(() => rtoCases.id),
  daysBeforeInterval: integer('days_before_interval').default(30).notNull(),
  isDismissed: boolean('is_dismissed').default(false).notNull(),
  severity: text('severity').default('medium').notNull(), // 'high', 'medium', 'low'
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(), // 'create', 'upload', 'download', 'edit', 'delete', 'archive', 'status_change', 'ocr_extract'
  entityType: text('entity_type').notNull(), // 'client', 'vehicle', 'showroom', 'rto_case', 'exchange_case', 'document', 'settings'
  entityId: text('entity_id').notNull(),
  details: text('details').default('').notNull(),
  userId: text('user_id').default('system').notNull(),
  ipAddress: text('ip_address').default('127.0.0.1').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  vehicles: many(vehicles),
  rtoCases: many(rtoCases),
  documents: many(documents),
  exchangeCases: many(exchangeCases),
}));

export const showroomsRelations = relations(showrooms, ({ many }) => ({
  vehicles: many(vehicles),
  exchangeCases: many(exchangeCases),
  rtoCases: many(rtoCases),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  client: one(clients, {
    fields: [vehicles.clientId],
    references: [clients.id],
  }),
  showroom: one(showrooms, {
    fields: [vehicles.showroomId],
    references: [showrooms.id],
  }),
  documents: many(documents),
  rtoCases: many(rtoCases),
}));

export const rtoCasesRelations = relations(rtoCases, ({ one, many }) => ({
  client: one(clients, {
    fields: [rtoCases.clientId],
    references: [clients.id],
  }),
  vehicle: one(vehicles, {
    fields: [rtoCases.vehicleId],
    references: [vehicles.id],
  }),
  showroom: one(showrooms, {
    fields: [rtoCases.showroomId],
    references: [showrooms.id],
  }),
  checklists: many(caseChecklists),
  documents: many(documents),
}));

export const caseChecklistsRelations = relations(caseChecklists, ({ one }) => ({
  rtoCase: one(rtoCases, {
    fields: [caseChecklists.caseId],
    references: [rtoCases.id],
  }),
}));

export const exchangeCasesRelations = relations(exchangeCases, ({ one, many }) => ({
  client: one(clients, {
    fields: [exchangeCases.clientId],
    references: [clients.id],
  }),
  showroom: one(showrooms, {
    fields: [exchangeCases.showroomId],
    references: [showrooms.id],
  }),
  oldVehicle: one(vehicles, {
    fields: [exchangeCases.oldVehicleId],
    references: [vehicles.id],
  }),
  newVehicle: one(vehicles, {
    fields: [exchangeCases.newVehicleId],
    references: [vehicles.id],
  }),
  documents: many(documents),
}));
