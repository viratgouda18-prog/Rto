import { Router, Request, Response } from 'express';
import { db } from '../src/db/index.ts';
import * as schema from '../src/db/schema.ts';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { getServiceChecklist } from '../src/utils/checklists.ts';
import { maskAadhaar, isValidIndianMobile } from '../src/utils/validators.ts';

const api = Router();

// Initialize Gemini AI for server-side OCR processing
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for audit logs
async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  details: string,
  userId = 'system',
  ipAddress = '127.0.0.1'
) {
  try {
    await db.insert(schema.auditLogs).values({
      action,
      entityType,
      entityId,
      details,
      userId,
      ipAddress,
    });
  } catch (err) {
    console.warn('Failed to record audit log:', err);
  }
}

// ----------------------------------------------------
// 0. AUTH & AUDIT LOGGING FOR USER SESSIONS
// ----------------------------------------------------
api.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, role, agentName } = req.body;
    const actor = (agentName || username || 'RTO Agent').trim();
    const userRole = (role || 'Senior RTO Officer').trim();
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const sessionId = `AUTH-${Date.now().toString().slice(-6)}`;

    await logAudit(
      'login',
      'session',
      sessionId,
      `User "${actor}" (${userRole}) logged in to Karnataka RTO Document Portal`,
      actor,
      ip
    );

    res.json({
      success: true,
      user: {
        username: username || 'rto_agent',
        role: userRole,
        agentName: actor,
      },
      sessionId,
      loginTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error logging user in:', error);
    res.status(500).json({ error: 'Failed to process login' });
  }
});

// ----------------------------------------------------
// 1. DASHBOARD REAL STATISTICS
// ----------------------------------------------------
api.get('/stats', async (_req: Request, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const thirtyDaysStr = thirtyDaysLater.toISOString().split('T')[0];

    const safeCount = async (p: Promise<any[]>): Promise<number> => {
      try {
        const rows = await p;
        return Number(rows?.[0]?.count || 0);
      } catch (e) {
        console.warn('Metric count query fallback:', e);
        return 0;
      }
    };

    const safeRows = async <T>(p: Promise<T[]>, fallback: T[] = []): Promise<T[]> => {
      try {
        return await p;
      } catch (e) {
        console.warn('Metric rows query fallback:', e);
        return fallback;
      }
    };

    const [
      clientsCount,
      showroomsCount,
      vehiclesCount,
      tractorsCount,
      tractorExchangesCount,
      activeCasesCount,
      pendingCasesCount,
      completedCasesCount,
      missingDocsCount,
      expiringInsuranceCount,
      recentActivity,
      recentDocuments,
      pendingWork,
      expiringVehicles,
      allShowrooms,
    ] = await Promise.all([
      safeCount(
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.clients)
          .where(eq(schema.clients.status, 'active'))
      ),
      safeCount(
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.showrooms)
          .where(eq(schema.showrooms.status, 'active'))
      ),
      safeCount(
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.vehicles)
          .where(eq(schema.vehicles.status, 'active'))
      ),
      safeCount(
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.vehicles)
          .where(and(
            eq(schema.vehicles.status, 'active'),
            or(eq(schema.vehicles.isTractor, true), eq(schema.vehicles.vehicleType, 'tractor'))
          ))
      ),
      safeCount(
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.exchangeCases)
          .where(eq(schema.exchangeCases.isTractorExchange, true))
      ),
      safeCount(
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.rtoCases)
          .where(or(
            eq(schema.rtoCases.status, 'pending'),
            eq(schema.rtoCases.status, 'in_progress'),
            eq(schema.rtoCases.status, 'waiting_for_documents')
          ))
      ),
      safeCount(
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.rtoCases)
          .where(eq(schema.rtoCases.status, 'pending'))
      ),
      safeCount(
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.rtoCases)
          .where(eq(schema.rtoCases.status, 'completed'))
      ),
      safeCount(
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.caseChecklists)
          .where(and(
            eq(schema.caseChecklists.isMandatory, true),
            eq(schema.caseChecklists.isCompleted, false)
          ))
      ),
      safeCount(
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.vehicles)
          .where(and(
            sql`${schema.vehicles.insuranceExpiryDate} != ''`,
            sql`${schema.vehicles.insuranceExpiryDate} <= ${thirtyDaysStr}`
          ))
      ),
      safeRows(
        db
          .select()
          .from(schema.auditLogs)
          .orderBy(desc(schema.auditLogs.timestamp))
          .limit(8)
      ),
      safeRows(
        db
          .select({
            id: schema.documents.id,
            docId: schema.documents.docId,
            title: schema.documents.title,
            docType: schema.documents.docType,
            fileName: schema.documents.fileName,
            fileType: schema.documents.fileType,
            fileSize: schema.documents.fileSize,
            createdAt: schema.documents.createdAt,
          })
          .from(schema.documents)
          .orderBy(desc(schema.documents.createdAt))
          .limit(6)
      ),
      safeRows(
        db
          .select({
            id: schema.rtoCases.id,
            caseId: schema.rtoCases.caseId,
            serviceType: schema.rtoCases.serviceType,
            rtoOffice: schema.rtoCases.rtoOffice,
            status: schema.rtoCases.status,
            dueDate: schema.rtoCases.dueDate,
            vehicleReg: schema.vehicles.registrationNumber,
            clientName: schema.clients.fullName,
          })
          .from(schema.rtoCases)
          .leftJoin(schema.vehicles, eq(schema.rtoCases.vehicleId, schema.vehicles.id))
          .leftJoin(schema.clients, eq(schema.rtoCases.clientId, schema.clients.id))
          .where(or(
            eq(schema.rtoCases.status, 'pending'),
            eq(schema.rtoCases.status, 'in_progress'),
            eq(schema.rtoCases.status, 'waiting_for_documents')
          ))
          .orderBy(desc(schema.rtoCases.createdAt))
          .limit(6)
      ),
      safeRows(
        db
          .select({
            id: schema.vehicles.id,
            vehicleId: schema.vehicles.vehicleId,
            regNumber: schema.vehicles.registrationNumber,
            model: schema.vehicles.model,
            ownerName: schema.vehicles.ownerName,
            insuranceExpiryDate: schema.vehicles.insuranceExpiryDate,
            tempRegExpiryDate: schema.vehicles.tempRegExpiryDate,
          })
          .from(schema.vehicles)
          .where(or(
            and(sql`${schema.vehicles.insuranceExpiryDate} != ''`, sql`${schema.vehicles.insuranceExpiryDate} <= ${thirtyDaysStr}`),
            and(sql`${schema.vehicles.tempRegExpiryDate} != ''`, sql`${schema.vehicles.tempRegExpiryDate} <= ${thirtyDaysStr}`)
          ))
          .limit(6)
      ),
      safeRows(
        db
          .select({
            id: schema.showrooms.id,
            showroomId: schema.showrooms.showroomId,
            name: schema.showrooms.name,
          })
          .from(schema.showrooms)
          .where(eq(schema.showrooms.status, 'active'))
      ),
    ]);

    let showroomOverview: any[] = [];
    if (allShowrooms.length > 0) {
      showroomOverview = await Promise.all(
        allShowrooms.map(async (sr) => {
          const [newVehCount, usedVehCount, exchangeCount] = await Promise.all([
            safeCount(
              db
                .select({ count: sql<number>`count(*)` })
                .from(schema.vehicles)
                .where(and(eq(schema.vehicles.showroomId, sr.id), eq(schema.vehicles.category, 'new')))
            ),
            safeCount(
              db
                .select({ count: sql<number>`count(*)` })
                .from(schema.vehicles)
                .where(and(eq(schema.vehicles.showroomId, sr.id), eq(schema.vehicles.category, 'used')))
            ),
            safeCount(
              db
                .select({ count: sql<number>`count(*)` })
                .from(schema.exchangeCases)
                .where(eq(schema.exchangeCases.showroomId, sr.id))
            ),
          ]);

          return {
            ...sr,
            newVehicles: newVehCount,
            usedVehicles: usedVehCount,
            exchangeCases: exchangeCount,
          };
        })
      );
    }

    res.json({
      totalClients: clientsCount,
      totalShowrooms: showroomsCount,
      totalVehicles: vehiclesCount,
      totalTractors: tractorsCount,
      tractorExchanges: tractorExchangesCount,
      activeCases: activeCasesCount,
      pendingCases: pendingCasesCount,
      completedCases: completedCasesCount,
      missingDocs: missingDocsCount,
      upcomingExpiries: expiringInsuranceCount,
      recentActivity,
      recentDocuments,
      pendingWork,
      expiringVehicles,
      showroomOverview,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    // Return sanitized resilient default stats rather than failing the whole application
    res.json({
      totalClients: 0,
      totalShowrooms: 0,
      totalVehicles: 0,
      totalTractors: 0,
      tractorExchanges: 0,
      activeCases: 0,
      pendingCases: 0,
      completedCases: 0,
      missingDocs: 0,
      upcomingExpiries: 0,
      recentActivity: [],
      recentDocuments: [],
      pendingWork: [],
      expiringVehicles: [],
      showroomOverview: [],
    });
  }
});

// ----------------------------------------------------
// 2. CLIENT MANAGEMENT
// ----------------------------------------------------
api.get('/clients', async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    let query = db.select().from(schema.clients);
    
    const all = await query.orderBy(desc(schema.clients.createdAt));
    let filtered = all;

    if (status && status !== 'all') {
      filtered = filtered.filter((c) => c.status === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.mobileNumber.toLowerCase().includes(q) ||
          c.clientId.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  } catch (error: any) {
    console.error('Error getting clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

api.get('/clients/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Linked vehicles
    const vehicles = await db.select().from(schema.vehicles).where(eq(schema.vehicles.clientId, id));
    // Linked RTO cases
    const cases = await db.select().from(schema.rtoCases).where(eq(schema.rtoCases.clientId, id));
    // Linked documents
    const documents = await db
      .select({
        id: schema.documents.id,
        docId: schema.documents.docId,
        title: schema.documents.title,
        docType: schema.documents.docType,
        fileName: schema.documents.fileName,
        fileType: schema.documents.fileType,
        fileSize: schema.documents.fileSize,
        version: schema.documents.version,
        createdAt: schema.documents.createdAt,
      })
      .from(schema.documents)
      .where(eq(schema.documents.clientId, id));

    res.json({ ...client, vehicles, cases, documents });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
});

api.post('/clients', async (req: Request, res: Response) => {
  try {
    const { fullName, mobileNumber, alternateMobile, address, aadhaarRaw, photoUrl, aadhaarDocUrl, notes } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Client full name is required' });
    }
    if (!isValidIndianMobile(mobileNumber)) {
      return res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required' });
    }

    // Check for duplicate client by mobile number
    const [existing] = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.mobileNumber, mobileNumber.trim()));

    if (existing) {
      return res.status(409).json({ error: `A client with mobile number ${mobileNumber} already exists (${existing.clientId})` });
    }

    const clientId = `KA-CLT-${Math.floor(1000 + Math.random() * 9000)}`;
    const maskedAadhaar = maskAadhaar(aadhaarRaw || '');

    const [newClient] = await db
      .insert(schema.clients)
      .values({
        clientId,
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        alternateMobile: alternateMobile ? alternateMobile.trim() : '',
        address: address ? address.trim() : 'Karnataka, India',
        aadhaarLastFour: maskedAadhaar,
        aadhaarDocUrl: aadhaarDocUrl || '',
        photoUrl: photoUrl || '',
        notes: notes || '',
        status: 'active',
      })
      .returning();

    await logAudit('create', 'client', clientId, `Created client ${fullName} (${clientId})`);
    res.status(201).json(newClient);
  } catch (error: any) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

api.put('/clients/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { fullName, mobileNumber, alternateMobile, address, aadhaarRaw, photoUrl, aadhaarDocUrl, notes, status } = req.body;

    const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const updateData: any = {
      updatedAt: new Date(),
    };
    if (fullName) updateData.fullName = fullName.trim();
    if (mobileNumber) updateData.mobileNumber = mobileNumber.trim();
    if (alternateMobile !== undefined) updateData.alternateMobile = alternateMobile.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (aadhaarRaw) updateData.aadhaarLastFour = maskAadhaar(aadhaarRaw);
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (aadhaarDocUrl !== undefined) updateData.aadhaarDocUrl = aadhaarDocUrl;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const [updated] = await db
      .update(schema.clients)
      .set(updateData)
      .where(eq(schema.clients.id, id))
      .returning();

    await logAudit('edit', 'client', client.clientId, `Updated client details for ${client.fullName}`);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

api.delete('/clients/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Mark as archived to maintain audit history
    await db.update(schema.clients).set({ status: 'archived', updatedAt: new Date() }).where(eq(schema.clients.id, id));
    await logAudit('archive', 'client', client.clientId, `Archived client ${client.fullName}`);
    res.json({ success: true, message: 'Client archived successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to archive client' });
  }
});

// ----------------------------------------------------
// 3. SHOWROOM MANAGEMENT
// ----------------------------------------------------
api.get('/showrooms', async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.showrooms).orderBy(desc(schema.showrooms.createdAt));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch showrooms' });
  }
});

api.get('/showrooms/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [showroom] = await db.select().from(schema.showrooms).where(eq(schema.showrooms.id, id));
    if (!showroom) return res.status(404).json({ error: 'Showroom not found' });

    // Category A: New Vehicles
    const newVehicles = await db
      .select()
      .from(schema.vehicles)
      .where(and(eq(schema.vehicles.showroomId, id), eq(schema.vehicles.category, 'new')));

    // Category B: Used Vehicles
    const usedVehicles = await db
      .select()
      .from(schema.vehicles)
      .where(and(eq(schema.vehicles.showroomId, id), eq(schema.vehicles.category, 'used')));

    // Category C: Exchange Cases
    const exchangeCasesList = await db
      .select()
      .from(schema.exchangeCases)
      .where(eq(schema.exchangeCases.showroomId, id));

    // Tractor Specific Categories
    const newTractors = newVehicles.filter((v) => v.isTractor || v.vehicleType === 'tractor');
    const usedTractors = usedVehicles.filter((v) => v.isTractor || v.vehicleType === 'tractor');
    const tractorExchanges = exchangeCasesList.filter((e) => e.isTractorExchange);

    res.json({
      ...showroom,
      newVehicles,
      usedVehicles,
      exchangeCases: exchangeCasesList,
      newTractors,
      usedTractors,
      tractorExchanges,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch showroom details' });
  }
});

api.post('/showrooms', async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, mobileNumber, email, address, notes, dealershipType } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Showroom name is required' });
    if (!mobileNumber || !mobileNumber.trim()) return res.status(400).json({ error: 'Contact mobile number is required' });

    const showroomId = `KA-SHR-${Math.floor(100 + Math.random() * 900)}`;

    const [newShowroom] = await db
      .insert(schema.showrooms)
      .values({
        showroomId,
        name: name.trim(),
        contactPerson: contactPerson ? contactPerson.trim() : '',
        mobileNumber: mobileNumber.trim(),
        email: email ? email.trim() : '',
        address: address ? address.trim() : 'Karnataka',
        dealershipType: dealershipType || 'automobile',
        notes: notes || '',
        status: 'active',
      })
      .returning();

    await logAudit('create', 'showroom', showroomId, `Created showroom ${name} (${dealershipType || 'automobile'})`);
    res.status(201).json(newShowroom);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create showroom' });
  }
});

api.put('/showrooms/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, contactPerson, mobileNumber, email, address, notes, status, dealershipType } = req.body;

    const [showroom] = await db.select().from(schema.showrooms).where(eq(schema.showrooms.id, id));
    if (!showroom) return res.status(404).json({ error: 'Showroom not found' });

    const [updated] = await db
      .update(schema.showrooms)
      .set({
        name: name?.trim() || showroom.name,
        contactPerson: contactPerson !== undefined ? contactPerson.trim() : showroom.contactPerson,
        mobileNumber: mobileNumber?.trim() || showroom.mobileNumber,
        email: email !== undefined ? email.trim() : showroom.email,
        address: address !== undefined ? address.trim() : showroom.address,
        dealershipType: dealershipType !== undefined ? dealershipType : showroom.dealershipType,
        notes: notes !== undefined ? notes : showroom.notes,
        status: status || showroom.status,
      })
      .where(eq(schema.showrooms.id, id))
      .returning();

    await logAudit('edit', 'showroom', showroom.showroomId, `Updated showroom ${showroom.name}`);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update showroom' });
  }
});

api.delete('/showrooms/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [showroom] = await db.select().from(schema.showrooms).where(eq(schema.showrooms.id, id));
    if (!showroom) return res.status(404).json({ error: 'Showroom not found' });

    await db.update(schema.vehicles).set({ showroomId: null }).where(eq(schema.vehicles.showroomId, id));
    await db.delete(schema.showrooms).where(eq(schema.showrooms.id, id));
    await logAudit('delete', 'showroom', showroom.showroomId, `Deleted dealership/showroom ${showroom.name}`);
    res.json({ success: true, message: 'Showroom deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete showroom' });
  }
});

// ----------------------------------------------------
// 4. VEHICLE DOCUMENT MANAGEMENT
// ----------------------------------------------------
api.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const { search, category, showroomId, clientId, isTractor } = req.query;
    let list = await db
      .select({
        vehicle: schema.vehicles,
        client: schema.clients,
        showroom: schema.showrooms,
      })
      .from(schema.vehicles)
      .leftJoin(schema.clients, eq(schema.vehicles.clientId, schema.clients.id))
      .leftJoin(schema.showrooms, eq(schema.vehicles.showroomId, schema.showrooms.id))
      .orderBy(desc(schema.vehicles.createdAt));

    let results = list.map((item) => ({
      ...item.vehicle,
      clientName: item.client?.fullName || '',
      showroomName: item.showroom?.name || '',
    }));

    if (isTractor === 'true') {
      results = results.filter((v) => v.isTractor || v.vehicleType === 'tractor');
    } else if (isTractor === 'false') {
      results = results.filter((v) => !v.isTractor && v.vehicleType !== 'tractor');
    }

    if (category && category !== 'all') {
      results = results.filter((v) => v.category === category);
    }
    if (showroomId && showroomId !== 'all') {
      results = results.filter((v) => v.showroomId === parseInt(showroomId as string, 10));
    }
    if (clientId && clientId !== 'all') {
      results = results.filter((v) => v.clientId === parseInt(clientId as string, 10));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      results = results.filter(
        (v) =>
          v.registrationNumber?.toLowerCase().includes(q) ||
          v.vehicleId.toLowerCase().includes(q) ||
          v.chassisNumber.toLowerCase().includes(q) ||
          v.engineNumber.toLowerCase().includes(q) ||
          v.ownerName.toLowerCase().includes(q) ||
          v.ownerMobile.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.manufacturer.toLowerCase().includes(q) ||
          (v.horsePower && v.horsePower.toLowerCase().includes(q)) ||
          (v.vehicleClass && v.vehicleClass.toLowerCase().includes(q))
      );
    }

    res.json(results);
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

api.get('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [vehicle] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    let client = null;
    if (vehicle.clientId) {
      const [c] = await db.select().from(schema.clients).where(eq(schema.clients.id, vehicle.clientId));
      client = c || null;
    }

    let showroom = null;
    if (vehicle.showroomId) {
      const [s] = await db.select().from(schema.showrooms).where(eq(schema.showrooms.id, vehicle.showroomId));
      showroom = s || null;
    }

    const documents = await db
      .select({
        id: schema.documents.id,
        docId: schema.documents.docId,
        title: schema.documents.title,
        docType: schema.documents.docType,
        fileName: schema.documents.fileName,
        fileType: schema.documents.fileType,
        fileSize: schema.documents.fileSize,
        version: schema.documents.version,
        ocrExtractedData: schema.documents.ocrExtractedData,
        ocrVerified: schema.documents.ocrVerified,
        createdAt: schema.documents.createdAt,
      })
      .from(schema.documents)
      .where(eq(schema.documents.vehicleId, id))
      .orderBy(desc(schema.documents.version));

    const rtoCasesList = await db.select().from(schema.rtoCases).where(eq(schema.rtoCases.vehicleId, id));

    res.json({ ...vehicle, client, showroom, documents, rtoCases: rtoCasesList });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch vehicle details' });
  }
});

api.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const {
      registrationNumber,
      vehicleType,
      category,
      manufacturer,
      model,
      manufacturingYear,
      chassisNumber,
      engineNumber,
      fuelType,
      ownerName,
      ownerMobile,
      clientId,
      showroomId,
      notes,
      insurancePolicyNo,
      insuranceExpiryDate,
      tempRegNumber,
      tempRegExpiryDate,
      horsePower,
      vehicleClass,
      isTractor,
    } = req.body;

    if (!vehicleType) return res.status(400).json({ error: 'Vehicle type is required' });
    if (!category) return res.status(400).json({ error: 'Vehicle category (new/used) is required' });
    if (!manufacturer) return res.status(400).json({ error: 'Manufacturer is required' });
    if (!model) return res.status(400).json({ error: 'Model is required' });
    if (!chassisNumber) return res.status(400).json({ error: 'Chassis number is required' });
    if (!engineNumber) return res.status(400).json({ error: 'Engine number is required' });
    if (!ownerName) return res.status(400).json({ error: 'Owner name is required' });

    const isTractorBool = Boolean(isTractor === true || isTractor === 'true' || vehicleType === 'tractor');
    const vehicleId = isTractorBool
      ? `KA-TRAC-${Math.floor(1000 + Math.random() * 9000)}`
      : `KA-VEH-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate secure QR Code payload (no sensitive PII inside QR payload, only secure entity reference token)
    const qrPayload = JSON.stringify({
      entity: isTractorBool ? 'tractor' : 'vehicle',
      id: vehicleId,
      ref: registrationNumber?.trim() || `NEW-${chassisNumber.slice(-6)}`,
      verifyUrl: `/vehicles/${vehicleId}`,
    });
    const qrCode = await QRCode.toDataURL(qrPayload);

    const [newVehicle] = await db
      .insert(schema.vehicles)
      .values({
        vehicleId,
        registrationNumber: registrationNumber ? registrationNumber.trim().toUpperCase() : '',
        vehicleType,
        category,
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        manufacturingYear: parseInt(manufacturingYear, 10) || new Date().getFullYear(),
        chassisNumber: chassisNumber.trim().toUpperCase(),
        engineNumber: engineNumber.trim().toUpperCase(),
        fuelType: fuelType || 'diesel',
        ownerName: ownerName.trim(),
        ownerMobile: ownerMobile ? ownerMobile.trim() : '',
        clientId: clientId ? parseInt(clientId, 10) : null,
        showroomId: showroomId ? parseInt(showroomId, 10) : null,
        horsePower: horsePower ? String(horsePower).trim() : '',
        vehicleClass: vehicleClass || (isTractorBool ? 'agricultural' : ''),
        isTractor: isTractorBool,
        qrCode,
        notes: notes || '',
        insurancePolicyNo: insurancePolicyNo || '',
        insuranceExpiryDate: insuranceExpiryDate || '',
        tempRegNumber: tempRegNumber || '',
        tempRegExpiryDate: tempRegExpiryDate || '',
        status: 'active',
      })
      .returning();

    await logAudit(
      'create',
      isTractorBool ? 'tractor' : 'vehicle',
      vehicleId,
      `Registered ${isTractorBool ? 'tractor' : 'vehicle'} ${manufacturer} ${model} (${newVehicle.registrationNumber || 'Unregistered'}${horsePower ? `, ${horsePower} HP` : ''})`
    );

    res.status(201).json(newVehicle);
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle record' });
  }
});

api.put('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [vehicle] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const updateFields: any = { updatedAt: new Date() };
    const allowed = [
      'registrationNumber',
      'vehicleType',
      'category',
      'manufacturer',
      'model',
      'manufacturingYear',
      'chassisNumber',
      'engineNumber',
      'fuelType',
      'ownerName',
      'ownerMobile',
      'clientId',
      'showroomId',
      'horsePower',
      'vehicleClass',
      'isTractor',
      'notes',
      'insurancePolicyNo',
      'insuranceExpiryDate',
      'tempRegNumber',
      'tempRegExpiryDate',
      'fitnessExpiryDate',
      'pucExpiryDate',
      'status',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'manufacturingYear' || key === 'clientId' || key === 'showroomId') {
          updateFields[key] = req.body[key] ? parseInt(req.body[key], 10) : null;
        } else if (typeof req.body[key] === 'string') {
          updateFields[key] = req.body[key].trim();
        } else {
          updateFields[key] = req.body[key];
        }
      }
    }

    const [updated] = await db
      .update(schema.vehicles)
      .set(updateFields)
      .where(eq(schema.vehicles.id, id))
      .returning();

    await logAudit('edit', 'vehicle', vehicle.vehicleId, `Updated vehicle details`);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

api.delete('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [vehicle] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
    if (!vehicle) return res.status(404).json({ error: 'Vehicle/tractor record not found' });

    // Clean up dependent records
    await db.delete(schema.caseChecklists).where(sql`${schema.caseChecklists.caseId} IN (SELECT id FROM ${schema.rtoCases} WHERE vehicle_id = ${id})`);
    await db.delete(schema.rtoCases).where(eq(schema.rtoCases.vehicleId, id));
    await db.delete(schema.documents).where(eq(schema.documents.vehicleId, id));
    await db.delete(schema.reminders).where(eq(schema.reminders.vehicleId, id));
    await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));

    await logAudit(
      'delete',
      'vehicle',
      vehicle.vehicleId,
      `Deleted machinery/vehicle record ${vehicle.manufacturer} ${vehicle.model} (${vehicle.registrationNumber || vehicle.vehicleId})`
    );
    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting vehicle/tractor:', error);
    res.status(500).json({ error: 'Failed to delete vehicle record' });
  }
});

// ----------------------------------------------------
// 5. EXCHANGE CASE MANAGEMENT
// ----------------------------------------------------
api.get('/exchange-cases', async (_req: Request, res: Response) => {
  try {
    const cases = await db
      .select({
        exchange: schema.exchangeCases,
        client: schema.clients,
        showroom: schema.showrooms,
        oldVehicle: schema.vehicles,
      })
      .from(schema.exchangeCases)
      .leftJoin(schema.clients, eq(schema.exchangeCases.clientId, schema.clients.id))
      .leftJoin(schema.showrooms, eq(schema.exchangeCases.showroomId, schema.showrooms.id))
      .leftJoin(schema.vehicles, eq(schema.exchangeCases.oldVehicleId, schema.vehicles.id))
      .orderBy(desc(schema.exchangeCases.createdAt));

    const enriched = await Promise.all(
      cases.map(async (c) => {
        const [newVeh] = await db
          .select()
          .from(schema.vehicles)
          .where(eq(schema.vehicles.id, c.exchange.newVehicleId));

        return {
          ...c.exchange,
          clientName: c.client?.fullName,
          clientMobile: c.client?.mobileNumber,
          showroomName: c.showroom?.name,
          oldVehicle: c.oldVehicle,
          newVehicle: newVeh || null,
        };
      })
    );

    res.json(enriched);
  } catch (error: any) {
    console.error('Error fetching exchange cases:', error);
    res.status(500).json({ error: 'Failed to fetch exchange cases' });
  }
});

api.post('/exchange-cases', async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      showroomId,
      oldVehicleId,
      newVehicleId,
      oldOwnerName,
      oldOwnerMobile,
      newOwnerName,
      newOwnerMobile,
      notes,
      pendingSignatures,
    } = req.body;

    if (!clientId || !showroomId || !oldVehicleId || !newVehicleId) {
      return res.status(400).json({ error: 'Client, Showroom, Old Vehicle, and New Vehicle are all required' });
    }

    const [oldVeh] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, parseInt(oldVehicleId, 10)));
    const [newVeh] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, parseInt(newVehicleId, 10)));
    const isTractorEx = Boolean(
      req.body.isTractorExchange ||
      oldVeh?.isTractor ||
      oldVeh?.vehicleType === 'tractor' ||
      newVeh?.isTractor ||
      newVeh?.vehicleType === 'tractor'
    );

    const exchangeId = isTractorEx
      ? `KA-TEXC-${Math.floor(1000 + Math.random() * 9000)}`
      : `KA-EXC-${Math.floor(1000 + Math.random() * 9000)}`;

    const qrPayload = JSON.stringify({
      entity: isTractorEx ? 'tractor_exchange_case' : 'exchange_case',
      id: exchangeId,
      verifyUrl: `/exchange-cases/${exchangeId}`,
    });
    const qrCode = await QRCode.toDataURL(qrPayload);

    const [newExchange] = await db
      .insert(schema.exchangeCases)
      .values({
        exchangeId,
        clientId: parseInt(clientId, 10),
        showroomId: parseInt(showroomId, 10),
        oldVehicleId: parseInt(oldVehicleId, 10),
        newVehicleId: parseInt(newVehicleId, 10),
        oldOwnerName: oldOwnerName?.trim() || 'Old Owner',
        oldOwnerMobile: oldOwnerMobile?.trim() || '',
        newOwnerName: newOwnerName?.trim() || 'New Owner',
        newOwnerMobile: newOwnerMobile?.trim() || '',
        transferStatus: 'pending',
        newRegStatus: 'pending',
        handoverPaperworkStatus: 'pending',
        isTractorExchange: isTractorEx,
        pendingSignatures: pendingSignatures || 'Form 29/30 signature pending from seller',
        qrCode,
        notes: notes || '',
        status: 'active',
      })
      .returning();

    await logAudit(
      'create',
      'exchange_case',
      exchangeId,
      `Created ${isTractorEx ? 'tractor ' : ''}exchange case ${exchangeId} linking records #${oldVehicleId} and #${newVehicleId}`
    );

    res.status(201).json(newExchange);
  } catch (error: any) {
    console.error('Error creating exchange case:', error);
    res.status(500).json({ error: 'Failed to create exchange case' });
  }
});

api.put('/exchange-cases/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [exchange] = await db.select().from(schema.exchangeCases).where(eq(schema.exchangeCases.id, id));
    if (!exchange) return res.status(404).json({ error: 'Exchange case not found' });

    const {
      transferStatus,
      newRegStatus,
      handoverPaperworkStatus,
      pendingSignatures,
      notes,
      status,
    } = req.body;

    const [updated] = await db
      .update(schema.exchangeCases)
      .set({
        transferStatus: transferStatus || exchange.transferStatus,
        newRegStatus: newRegStatus || exchange.newRegStatus,
        handoverPaperworkStatus: handoverPaperworkStatus || exchange.handoverPaperworkStatus,
        pendingSignatures: pendingSignatures !== undefined ? pendingSignatures : exchange.pendingSignatures,
        notes: notes !== undefined ? notes : exchange.notes,
        status: status || exchange.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.exchangeCases.id, id))
      .returning();

    const statusChanges: string[] = [];
    if (status && status !== exchange.status) statusChanges.push(`case: ${exchange.status} -> ${status}`);
    if (transferStatus && transferStatus !== exchange.transferStatus) statusChanges.push(`transfer: ${exchange.transferStatus} -> ${transferStatus}`);
    if (newRegStatus && newRegStatus !== exchange.newRegStatus) statusChanges.push(`new reg: ${exchange.newRegStatus} -> ${newRegStatus}`);
    if (handoverPaperworkStatus && handoverPaperworkStatus !== exchange.handoverPaperworkStatus) statusChanges.push(`handover: ${exchange.handoverPaperworkStatus} -> ${handoverPaperworkStatus}`);

    if (statusChanges.length > 0) {
      await logAudit(
        'status_change',
        'exchange_case',
        exchange.exchangeId,
        `Exchange case ${exchange.exchangeId} status updated: ${statusChanges.join(', ')}`,
        'RTO Agent'
      );
    } else {
      await logAudit('edit', 'exchange_case', exchange.exchangeId, `Updated notes / paperwork for exchange ${exchange.exchangeId}`, 'RTO Agent');
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update exchange case' });
  }
});

api.delete('/exchange-cases/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [exchange] = await db.select().from(schema.exchangeCases).where(eq(schema.exchangeCases.id, id));
    if (!exchange) return res.status(404).json({ error: 'Exchange case not found' });

    await db.delete(schema.exchangeCases).where(eq(schema.exchangeCases.id, id));
    await logAudit('delete', 'exchange_case', exchange.exchangeId, `Deleted exchange case ${exchange.exchangeId}`);
    res.json({ success: true, message: 'Exchange case deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete exchange case' });
  }
});

// ----------------------------------------------------
// 6. RTO WORK MANAGEMENT
// ----------------------------------------------------
api.get('/rto-cases', async (req: Request, res: Response) => {
  try {
    const { status, serviceType, search } = req.query;
    const cases = await db
      .select({
        rtoCase: schema.rtoCases,
        client: schema.clients,
        vehicle: schema.vehicles,
        showroom: schema.showrooms,
      })
      .from(schema.rtoCases)
      .leftJoin(schema.clients, eq(schema.rtoCases.clientId, schema.clients.id))
      .leftJoin(schema.vehicles, eq(schema.rtoCases.vehicleId, schema.vehicles.id))
      .leftJoin(schema.showrooms, eq(schema.rtoCases.showroomId, schema.showrooms.id))
      .orderBy(desc(schema.rtoCases.createdAt));

    let enriched = await Promise.all(
      cases.map(async (c) => {
        const checklists = await db
          .select()
          .from(schema.caseChecklists)
          .where(eq(schema.caseChecklists.caseId, c.rtoCase.id));

        const totalChecklist = checklists.length;
        const completedChecklist = checklists.filter((item) => item.isCompleted).length;

        return {
          ...c.rtoCase,
          clientName: c.client?.fullName,
          clientMobile: c.client?.mobileNumber,
          vehicleReg: c.vehicle?.registrationNumber,
          vehicleModel: c.vehicle ? `${c.vehicle.manufacturer} ${c.vehicle.model}` : '',
          showroomName: c.showroom?.name,
          checklists,
          checklistProgress: totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 100,
        };
      })
    );

    if (status && status !== 'all') {
      enriched = enriched.filter((c) => c.status === status);
    }
    if (serviceType && serviceType !== 'all') {
      enriched = enriched.filter((c) => c.serviceType === serviceType);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      enriched = enriched.filter(
        (c) =>
          c.caseId.toLowerCase().includes(q) ||
          c.rtoOffice.toLowerCase().includes(q) ||
          c.clientName?.toLowerCase().includes(q) ||
          c.vehicleReg?.toLowerCase().includes(q) ||
          c.applicationNumber?.toLowerCase().includes(q)
      );
    }

    res.json(enriched);
  } catch (error: any) {
    console.error('Error fetching RTO cases:', error);
    res.status(500).json({ error: 'Failed to fetch RTO cases' });
  }
});

api.post('/rto-cases', async (req: Request, res: Response) => {
  try {
    const { clientId, vehicleId, showroomId, serviceType, rtoOffice, applicationNumber, assignedStaff, dueDate, notes } = req.body;

    if (!clientId || !vehicleId || !serviceType || !rtoOffice) {
      return res.status(400).json({ error: 'Client, Vehicle, Service Type, and RTO Office are required' });
    }

    const year = new Date().getFullYear();
    const caseId = `KA-RTO-${year}-${Math.floor(100 + Math.random() * 900)}`;

    const [newCase] = await db
      .insert(schema.rtoCases)
      .values({
        caseId,
        clientId: parseInt(clientId, 10),
        vehicleId: parseInt(vehicleId, 10),
        showroomId: showroomId ? parseInt(showroomId, 10) : null,
        serviceType,
        rtoOffice,
        applicationNumber: applicationNumber ? applicationNumber.trim() : '',
        assignedStaff: assignedStaff ? assignedStaff.trim() : 'Agent',
        status: 'pending',
        dueDate: dueDate || '',
        notes: notes || '',
      })
      .returning();

    // Automatically generate Karnataka RTO checklist based on service type
    const templateChecklist = getServiceChecklist(serviceType);
    if (templateChecklist.length > 0) {
      const checklistValues = templateChecklist.map((item) => ({
        caseId: newCase.id,
        itemKey: item.key,
        itemLabel: item.label,
        itemLabelKn: item.labelKn,
        isMandatory: item.isMandatory,
        isCompleted: false,
        verifiedBy: '',
        notes: '',
      }));
      await db.insert(schema.caseChecklists).values(checklistValues);
    }

    await logAudit(
      'create',
      'rto_case',
      caseId,
      `Created RTO case ${caseId} (${serviceType}) for vehicle #${vehicleId} at ${rtoOffice}`
    );

    res.status(201).json(newCase);
  } catch (error: any) {
    console.error('Error creating RTO case:', error);
    res.status(500).json({ error: 'Failed to create RTO case' });
  }
});

api.put('/rto-cases/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [c] = await db.select().from(schema.rtoCases).where(eq(schema.rtoCases.id, id));
    if (!c) return res.status(404).json({ error: 'RTO Case not found' });

    const {
      status,
      applicationNumber,
      assignedStaff,
      dueDate,
      completionDate,
      notes,
      serviceType,
      rtoOffice,
      clientId,
      vehicleId,
    } = req.body;

    const [updated] = await db
      .update(schema.rtoCases)
      .set({
        status: status || c.status,
        applicationNumber: applicationNumber !== undefined ? applicationNumber.trim() : c.applicationNumber,
        assignedStaff: assignedStaff !== undefined ? assignedStaff.trim() : c.assignedStaff,
        dueDate: dueDate !== undefined ? dueDate : c.dueDate,
        completionDate: completionDate !== undefined ? completionDate : c.completionDate,
        notes: notes !== undefined ? notes : c.notes,
        serviceType: serviceType || c.serviceType,
        rtoOffice: rtoOffice || c.rtoOffice,
        clientId: clientId ? parseInt(clientId, 10) : c.clientId,
        vehicleId: vehicleId ? parseInt(vehicleId, 10) : c.vehicleId,
        updatedAt: new Date(),
      })
      .where(eq(schema.rtoCases.id, id))
      .returning();

    const oldStatus = c.status;
    const newStatus = status !== undefined ? status : c.status;
    const actor = (assignedStaff || c.assignedStaff || 'RTO Agent').trim();

    if (status !== undefined && status !== oldStatus) {
      await logAudit(
        'status_change',
        'rto_case',
        c.caseId,
        `Case ${c.caseId} (${c.serviceType}) status changed from "${oldStatus.toUpperCase()}" to "${newStatus.toUpperCase()}"`,
        actor
      );
    } else {
      await logAudit(
        'edit',
        'rto_case',
        c.caseId,
        `Updated details/due date for RTO case ${c.caseId} (${c.serviceType})`,
        actor
      );
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update RTO case' });
  }
});

api.delete('/rto-cases/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [c] = await db.select().from(schema.rtoCases).where(eq(schema.rtoCases.id, id));
    if (!c) return res.status(404).json({ error: 'RTO Case not found' });

    await db.delete(schema.caseChecklists).where(eq(schema.caseChecklists.caseId, id));
    await db.delete(schema.rtoCases).where(eq(schema.rtoCases.id, id));

    await logAudit('delete', 'rto_case', c.caseId, `Deleted RTO case ${c.caseId} (${c.serviceType})`);
    res.json({ success: true, message: 'RTO case deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete RTO case' });
  }
});

// Checklist item toggle and custom item addition
api.put('/case-checklists/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { isCompleted, verifiedBy } = req.body;

    const [item] = await db.select().from(schema.caseChecklists).where(eq(schema.caseChecklists.id, id));
    if (!item) return res.status(404).json({ error: 'Checklist item not found' });

    const newCompleted = isCompleted !== undefined ? isCompleted : !item.isCompleted;
    const verifier = (verifiedBy || 'RTO Agent').trim();

    const [updated] = await db
      .update(schema.caseChecklists)
      .set({
        isCompleted: newCompleted,
        verifiedBy: newCompleted ? verifier : '',
        verifiedAt: newCompleted ? new Date() : null,
      })
      .where(eq(schema.caseChecklists.id, id))
      .returning();

    // Log checklist verification as sensitive regulatory check
    await logAudit(
      'status_change',
      'case_checklist',
      `CASE-${item.caseId}`,
      `Checklist item "${item.itemLabel}" marked as ${newCompleted ? 'VERIFIED' : 'UNVERIFIED'}`,
      verifier
    );

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

// Also support POST for checklist toggle
api.post('/case-checklists/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { isCompleted, verifiedBy } = req.body;

    const [item] = await db.select().from(schema.caseChecklists).where(eq(schema.caseChecklists.id, id));
    if (!item) return res.status(404).json({ error: 'Checklist item not found' });

    const newCompleted = isCompleted !== undefined ? isCompleted : !item.isCompleted;
    const verifier = (verifiedBy || 'RTO Agent').trim();

    const [updated] = await db
      .update(schema.caseChecklists)
      .set({
        isCompleted: newCompleted,
        verifiedBy: newCompleted ? verifier : '',
        verifiedAt: newCompleted ? new Date() : null,
      })
      .where(eq(schema.caseChecklists.id, id))
      .returning();

    await logAudit(
      'status_change',
      'case_checklist',
      `CASE-${item.caseId}`,
      `Checklist item "${item.itemLabel}" marked as ${newCompleted ? 'VERIFIED' : 'UNVERIFIED'}`,
      verifier
    );

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

api.post('/case-checklists/:caseId/custom', async (req: Request, res: Response) => {
  try {
    const caseId = parseInt(req.params.caseId, 10);
    const { itemLabel, itemLabelKn, isMandatory } = req.body;

    if (!itemLabel || !itemLabel.trim()) {
      return res.status(400).json({ error: 'Checklist item label is required' });
    }

    const itemKey = `custom_${Date.now()}`;
    const [newItem] = await db
      .insert(schema.caseChecklists)
      .values({
        caseId,
        itemKey,
        itemLabel: itemLabel.trim(),
        itemLabelKn: itemLabelKn ? itemLabelKn.trim() : itemLabel.trim(),
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : true,
        isCompleted: false,
      })
      .returning();

    res.status(201).json(newItem);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add custom checklist item' });
  }
});

// ----------------------------------------------------
// 7. SECURE DOCUMENT CABINET & BUNDLE DOWNLOAD
// ----------------------------------------------------
api.get('/documents', async (req: Request, res: Response) => {
  try {
    const { docType, vehicleId, clientId, showroomId, caseId, search } = req.query;

    let docs = await db
      .select({
        document: schema.documents,
        client: schema.clients,
        vehicle: schema.vehicles,
        showroom: schema.showrooms,
      })
      .from(schema.documents)
      .leftJoin(schema.clients, eq(schema.documents.clientId, schema.clients.id))
      .leftJoin(schema.vehicles, eq(schema.documents.vehicleId, schema.vehicles.id))
      .leftJoin(schema.showrooms, eq(schema.documents.showroomId, schema.showrooms.id))
      .orderBy(desc(schema.documents.createdAt));

    let results = docs.map((d) => ({
      ...d.document,
      // Do not stream full base64 fileData in list to preserve memory/network bandwidth
      fileDataPreview: d.document.fileData.slice(0, 50),
      clientName: d.client?.fullName,
      vehicleReg: d.vehicle?.registrationNumber,
      showroomName: d.showroom?.name,
    }));

    if (docType && docType !== 'all') {
      results = results.filter((d) => d.docType === docType);
    }
    if (vehicleId && vehicleId !== 'all') {
      results = results.filter((d) => d.vehicleId === parseInt(vehicleId as string, 10));
    }
    if (clientId && clientId !== 'all') {
      results = results.filter((d) => d.clientId === parseInt(clientId as string, 10));
    }
    if (showroomId && showroomId !== 'all') {
      results = results.filter((d) => d.showroomId === parseInt(showroomId as string, 10));
    }
    if (caseId && caseId !== 'all') {
      results = results.filter((d) => d.caseId === parseInt(caseId as string, 10));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      results = results.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.clientName?.toLowerCase().includes(q) ||
          d.vehicleReg?.toLowerCase().includes(q) ||
          d.showroomName?.toLowerCase().includes(q) ||
          d.tags?.toLowerCase().includes(q)
      );
    }

    res.json(results);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Download/view single document with complete base64 data
api.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [doc] = await db.select().from(schema.documents).where(eq(schema.documents.id, id));
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await logAudit('download', 'document', doc.docId, `Viewed/downloaded document ${doc.title}`);
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch document file' });
  }
});

api.post('/documents', async (req: Request, res: Response) => {
  try {
    const {
      title,
      docType,
      fileName,
      fileType,
      fileSize,
      fileData,
      clientId,
      vehicleId,
      showroomId,
      caseId,
      exchangeCaseId,
      tags,
      notes,
      ocrExtractedData,
      ocrVerified,
      uploadedBy,
    } = req.body;

    if (!title || !docType || !fileData) {
      return res.status(400).json({ error: 'Document title, type, and file content are required' });
    }

    // Check versioning if vehicleId + docType exists
    let version = 1;
    if (vehicleId) {
      const existingVersions = await db
        .select({ version: schema.documents.version })
        .from(schema.documents)
        .where(and(eq(schema.documents.vehicleId, parseInt(vehicleId, 10)), eq(schema.documents.docType, docType)))
        .orderBy(desc(schema.documents.version))
        .limit(1);

      if (existingVersions.length > 0 && existingVersions[0].version) {
        version = existingVersions[0].version + 1;
      }
    }

    const docId = `KA-DOC-${Math.floor(10000 + Math.random() * 90000)}`;

    const [newDoc] = await db
      .insert(schema.documents)
      .values({
        docId,
        title: title.trim(),
        docType,
        fileName: fileName || `${docType}_document`,
        fileType: fileType || 'application/pdf',
        fileSize: fileSize || Math.round(fileData.length * 0.75),
        fileData,
        version,
        clientId: clientId ? parseInt(clientId, 10) : null,
        vehicleId: vehicleId ? parseInt(vehicleId, 10) : null,
        showroomId: showroomId ? parseInt(showroomId, 10) : null,
        caseId: caseId ? parseInt(caseId, 10) : null,
        exchangeCaseId: exchangeCaseId ? parseInt(exchangeCaseId, 10) : null,
        tags: tags || '',
        notes: notes || '',
        ocrExtractedData: ocrExtractedData ? JSON.stringify(ocrExtractedData) : '',
        ocrVerified: Boolean(ocrVerified),
        uploadedBy: uploadedBy || 'RTO Agent',
      })
      .returning();

    let entityDesc = '';
    if (clientId) {
      const [cl] = await db.select({ name: schema.clients.fullName, idStr: schema.clients.clientId }).from(schema.clients).where(eq(schema.clients.id, parseInt(clientId, 10)));
      if (cl) entityDesc += `Client: ${cl.name} (${cl.idStr})`;
    }
    if (vehicleId) {
      const [vh] = await db.select({ reg: schema.vehicles.registrationNumber, model: schema.vehicles.model }).from(schema.vehicles).where(eq(schema.vehicles.id, parseInt(vehicleId, 10)));
      if (vh) entityDesc += `${entityDesc ? ' | ' : ''}Vehicle: ${vh.reg || 'Unregistered'} (${vh.model})`;
    }

    const actor = (uploadedBy || 'RTO Agent').trim();
    await logAudit(
      'upload',
      'document',
      docId,
      `Uploaded ${title} [${docType.toUpperCase()}] (v${version})${entityDesc ? ` for ${entityDesc}` : ''}`,
      actor
    );

    res.status(201).json(newDoc);
  } catch (error: any) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

api.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [doc] = await db.select().from(schema.documents).where(eq(schema.documents.id, id));
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await db.delete(schema.documents).where(eq(schema.documents.id, id));
    await logAudit('delete', 'document', doc.docId, `Deleted document "${doc.title}" [${doc.docType.toUpperCase()}] (v${doc.version})`, 'RTO Agent');
    res.json({ success: true, message: 'Document deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

api.put('/documents/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [doc] = await db.select().from(schema.documents).where(eq(schema.documents.id, id));
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const { title, docType, tags, notes, ocrVerified } = req.body;

    const [updated] = await db
      .update(schema.documents)
      .set({
        title: title !== undefined ? title.trim() : doc.title,
        docType: docType !== undefined ? docType : doc.docType,
        tags: tags !== undefined ? tags.trim() : doc.tags,
        notes: notes !== undefined ? notes.trim() : doc.notes,
        ocrVerified: ocrVerified !== undefined ? Boolean(ocrVerified) : doc.ocrVerified,
      })
      .where(eq(schema.documents.id, id))
      .returning();

    await logAudit('edit', 'document', doc.docId, `Updated document "${updated.title}" [${updated.docType.toUpperCase()}]`);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// ZIP Download of Selected Documents for Offline Record Keeping
api.post('/documents/bundle', async (req: Request, res: Response) => {
  try {
    const { docIds, entityType, entityId, entityName, performedBy } = req.body;
    if (!Array.isArray(docIds) || docIds.length === 0) {
      return res.status(400).json({ error: 'Please select documents to bundle' });
    }

    const docsToBundle = await db
      .select({
        document: schema.documents,
        client: schema.clients,
        vehicle: schema.vehicles,
        showroom: schema.showrooms,
      })
      .from(schema.documents)
      .leftJoin(schema.clients, eq(schema.documents.clientId, schema.clients.id))
      .leftJoin(schema.vehicles, eq(schema.documents.vehicleId, schema.vehicles.id))
      .leftJoin(schema.showrooms, eq(schema.documents.showroomId, schema.showrooms.id))
      .where(sql`${schema.documents.id} IN (${sql.join(docIds, sql`, `)})`);

    if (docsToBundle.length === 0) {
      return res.status(404).json({ error: 'No documents found for selected IDs' });
    }

    const zip = new JSZip();
    const manifestLines: string[] = [
      '========================================================================',
      'KARNATAKA REGIONAL TRANSPORT OFFICE (RTO) - OFFICIAL DOSSIER MANIFEST',
      '========================================================================',
      `Export Timestamp : ${new Date().toISOString()}`,
      `Dossier Category : ${entityType ? entityType.toUpperCase() : 'GENERAL'} OFFLINE RECORD ARCHIVE`,
      `Entity Subject   : ${entityName || 'Selected RTO Records'} [ID: ${entityId || 'BATCH'}]`,
      `Authorized Agent : ${performedBy || 'Karnataka RTO Document Specialist'}`,
      `Total Documents  : ${docsToBundle.length} files bundled`,
      '------------------------------------------------------------------------',
      'DOCUMENT INVENTORY:',
    ];

    docsToBundle.forEach((item, index) => {
      const doc = item.document;
      let cleanBase64 = doc.fileData;
      if (cleanBase64.includes('base64,')) {
        cleanBase64 = cleanBase64.split('base64,')[1];
      }

      const ext = doc.fileName.includes('.')
        ? `.${doc.fileName.split('.').pop()}`
        : doc.fileType.includes('pdf')
        ? '.pdf'
        : '.jpg';

      const padIndex = String(index + 1).padStart(2, '0');
      const safeTitle = doc.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeName = `${padIndex}_${doc.docType.toUpperCase()}_${safeTitle}_v${doc.version}${ext}`;

      zip.file(safeName, cleanBase64, { base64: true });

      const clientInfo = item.client ? `Client: ${item.client.fullName} (${item.client.clientId})` : '';
      const vehInfo = item.vehicle ? `Veh: ${item.vehicle.registrationNumber || item.vehicle.model}` : '';
      const tagStr = [clientInfo, vehInfo].filter(Boolean).join(' | ');

      manifestLines.push(
        `${padIndex}. [${doc.docType.toUpperCase()}] ${doc.title} (v${doc.version}) -> ${safeName} (${(doc.fileSize / 1024).toFixed(1)} KB)${tagStr ? ` [${tagStr}]` : ''}`
      );
    });

    manifestLines.push('------------------------------------------------------------------------');
    manifestLines.push('REGULATORY & LEGAL NOTICE:');
    manifestLines.push('This archive contains official transport paperwork governed by');
    manifestLines.push('the Motor Vehicles Act, 1988, Central Motor Vehicles Rules 1989, and');
    manifestLines.push('Karnataka Motor Vehicles Rules. Client Aadhaar data is UIDAI-masked.');
    manifestLines.push('Bundled for offline record keeping, RTO desk submission, and inspection.');
    manifestLines.push('');
    manifestLines.push('Agent Signature: _______________________   Official Seal: ________________');
    manifestLines.push('========================================================================');

    // Add MANIFEST.txt into the root of the ZIP
    zip.file('MANIFEST.txt', manifestLines.join('\n'));

    const content = await zip.generateAsync({ type: 'base64' });
    const safeSubject = (entityId || entityName || 'Docs').replace(/[^a-zA-Z0-9_-]/g, '_');
    const zipFileName = `Karnataka_RTO_${safeSubject}_${new Date().toISOString().split('T')[0]}.zip`;

    await logAudit(
      'download',
      'document',
      entityId || 'BUNDLE',
      `Exported offline ZIP dossier containing ${docsToBundle.length} documents for ${entityType || 'record'}: ${entityName || entityId || 'Selection'}`,
      performedBy || 'RTO Agent'
    );

    res.json({
      zipBase64: content,
      fileName: zipFileName,
      count: docsToBundle.length,
      manifest: manifestLines.join('\n'),
    });
  } catch (error: any) {
    console.error('Error generating document bundle:', error);
    res.status(500).json({ error: 'Failed to bundle documents' });
  }
});

// ----------------------------------------------------
// 8. AI OCR EXTRACTION (Gemini 3.8 Flash)
// ----------------------------------------------------
api.post('/ocr', async (req: Request, res: Response) => {
  try {
    const { fileData, docType } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'File data is required for OCR scanning' });
    }

    // Determine mimeType and raw base64 string
    let mimeType = 'image/jpeg';
    let base64String = fileData;
    if (fileData.startsWith('data:')) {
      const match = fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64String = match[2];
      }
    }

    // Call Gemini 3.8 Flash for OCR extraction on Indian RTO documents
    const prompt = `You are an expert Indian Regional Transport Office (RTO) document parser. Analyze this uploaded vehicle document (RC / Insurance / Form 20 / Form 21 / Invoice / NOC).
Extract the following fields accurately. If a field is not visible, return null or empty string.

Required fields to extract:
1. registrationNumber: Standard Indian/Karnataka format (e.g. KA-01-AB-1234 or KA05MH9999). If unregistered, state "UNREGISTERED".
2. chassisNumber: Vehicle Identification Number (VIN), usually 17 characters.
3. engineNumber: Engine serial number.
4. ownerName: Name of the registered owner or purchaser.
5. insurancePolicyNo: Motor insurance policy number.
6. insuranceExpiryDate: Format YYYY-MM-DD.
7. vehicleManufacturer: Make (e.g. Honda, Maruti Suzuki, Tata, Hyundai, TVS, etc.).
8. vehicleModel: Model name (e.g. Activa 6G, Swift, Nexon, Creta, etc.).
9. fuelType: Petrol, Diesel, CNG, Electric, Hybrid.
10. documentTypeDetected: RC, Insurance, Form 20, Form 21, Showroom Invoice, etc.
11. confidenceNotes: Any observation about readability or state of document.

Return ONLY a valid JSON object with these keys. Do not include markdown code block formatting or backticks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64String,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const rawText = (response.text || '{}').trim();
    let cleaned = rawText;
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        rawOutput: rawText,
        error: 'Could not structure JSON, manual review required',
      };
    }

    await logAudit('ocr_extract', 'document', 'AI-OCR', `Performed OCR extraction for ${docType || 'document'}`);

    // Return extracted fields for user review and manual verification per guidelines
    res.json({
      success: true,
      extractedData: parsed,
      verified: false, // Per guidelines: never claim verified until user confirms
    });
  } catch (error: any) {
    console.error('OCR Extraction error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract text from document' });
  }
});

// ----------------------------------------------------
// 9. REMINDERS & ALERTS
// ----------------------------------------------------
api.get('/reminders', async (_req: Request, res: Response) => {
  try {
    const list = await db
      .select({
        reminder: schema.reminders,
        vehicle: schema.vehicles,
        client: schema.clients,
        rtoCase: schema.rtoCases,
      })
      .from(schema.reminders)
      .leftJoin(schema.vehicles, eq(schema.reminders.vehicleId, schema.vehicles.id))
      .leftJoin(schema.clients, eq(schema.reminders.clientId, schema.clients.id))
      .leftJoin(schema.rtoCases, eq(schema.reminders.caseId, schema.rtoCases.id))
      .orderBy(schema.reminders.targetDate);

    const enriched = list.map((r) => ({
      ...r.reminder,
      vehicleReg: r.vehicle?.registrationNumber,
      clientName: r.client?.fullName,
      clientMobile: r.client?.mobileNumber,
      caseNumber: r.rtoCase?.caseId,
    }));

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

api.post('/reminders', async (req: Request, res: Response) => {
  try {
    const { title, reminderType, targetDate, vehicleId, clientId, caseId, daysBeforeInterval, severity, notes } = req.body;

    if (!title || !targetDate || !reminderType) {
      return res.status(400).json({ error: 'Title, reminder type, and target date are required' });
    }

    const [newReminder] = await db
      .insert(schema.reminders)
      .values({
        title: title.trim(),
        reminderType,
        targetDate,
        vehicleId: vehicleId ? parseInt(vehicleId, 10) : null,
        clientId: clientId ? parseInt(clientId, 10) : null,
        caseId: caseId ? parseInt(caseId, 10) : null,
        daysBeforeInterval: parseInt(daysBeforeInterval, 10) || 30,
        severity: severity || 'medium',
        notes: notes || '',
        isDismissed: false,
      })
      .returning();

    res.status(201).json(newReminder);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

api.put('/reminders/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [updated] = await db
      .update(schema.reminders)
      .set({ isDismissed: true })
      .where(eq(schema.reminders.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to dismiss reminder' });
  }
});

api.put('/reminders/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rem] = await db.select().from(schema.reminders).where(eq(schema.reminders.id, id));
    if (!rem) return res.status(404).json({ error: 'Reminder not found' });

    const { title, reminderType, targetDate, daysBeforeInterval, severity, notes, isDismissed } = req.body;

    const [updated] = await db
      .update(schema.reminders)
      .set({
        title: title !== undefined ? title.trim() : rem.title,
        reminderType: reminderType !== undefined ? reminderType : rem.reminderType,
        targetDate: targetDate !== undefined ? targetDate : rem.targetDate,
        daysBeforeInterval: daysBeforeInterval !== undefined ? parseInt(daysBeforeInterval, 10) : rem.daysBeforeInterval,
        severity: severity !== undefined ? severity : rem.severity,
        notes: notes !== undefined ? notes.trim() : rem.notes,
        isDismissed: isDismissed !== undefined ? Boolean(isDismissed) : rem.isDismissed,
      })
      .where(eq(schema.reminders.id, id))
      .returning();

    await logAudit('edit', 'reminder', `REMINDER-${id}`, `Updated reminder "${updated.title}"`);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

api.delete('/reminders/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rem] = await db.select().from(schema.reminders).where(eq(schema.reminders.id, id));
    if (!rem) return res.status(404).json({ error: 'Reminder not found' });

    await db.delete(schema.reminders).where(eq(schema.reminders.id, id));
    await logAudit('delete', 'reminder', `REMINDER-${id}`, `Deleted reminder "${rem.title}"`);
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// ----------------------------------------------------
// 10. AUDIT LOGS & DATABASE BACKUP / RESTORE
// ----------------------------------------------------
api.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { action, search, limit } = req.query;
    const maxRows = limit ? parseInt(limit as string, 10) : 250;

    let logs = await db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(maxRows);

    if (action && action !== 'all') {
      logs = logs.filter((l) => l.action === action);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.details.toLowerCase().includes(q) ||
          l.entityId.toLowerCase().includes(q) ||
          l.entityType.toLowerCase().includes(q) ||
          l.userId.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q)
      );
    }

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

api.get('/backup', async (_req: Request, res: Response) => {
  try {
    const allClients = await db.select().from(schema.clients);
    const allShowrooms = await db.select().from(schema.showrooms);
    const allVehicles = await db.select().from(schema.vehicles);
    const allExchangeCases = await db.select().from(schema.exchangeCases);
    const allRtoCases = await db.select().from(schema.rtoCases);
    const allChecklists = await db.select().from(schema.caseChecklists);
    const allReminders = await db.select().from(schema.reminders);
    const allAuditLogs = await db.select().from(schema.auditLogs).limit(500);

    // Document metadata (omit heavy base64 to allow safe JSON export)
    const docMeta = await db
      .select({
        id: schema.documents.id,
        docId: schema.documents.docId,
        clientId: schema.documents.clientId,
        vehicleId: schema.documents.vehicleId,
        showroomId: schema.documents.showroomId,
        caseId: schema.documents.caseId,
        docType: schema.documents.docType,
        title: schema.documents.title,
        fileName: schema.documents.fileName,
        fileType: schema.documents.fileType,
        fileSize: schema.documents.fileSize,
        version: schema.documents.version,
        tags: schema.documents.tags,
        ocrExtractedData: schema.documents.ocrExtractedData,
        createdAt: schema.documents.createdAt,
      })
      .from(schema.documents);

    const backupData = {
      exportDate: new Date().toISOString(),
      system: 'Karnataka RTO Document Management System',
      counts: {
        clients: allClients.length,
        showrooms: allShowrooms.length,
        vehicles: allVehicles.length,
        exchangeCases: allExchangeCases.length,
        rtoCases: allRtoCases.length,
        documents: docMeta.length,
      },
      clients: allClients,
      showrooms: allShowrooms,
      vehicles: allVehicles,
      exchangeCases: allExchangeCases,
      rtoCases: allRtoCases,
      checklists: allChecklists,
      reminders: allReminders,
      documents: docMeta,
      auditLogs: allAuditLogs,
    };

    await logAudit('exportBackup', 'settings', 'SYSTEM', 'Exported database backup');
    res.json(backupData);
  } catch (error: any) {
    console.error('Error generating backup:', error);
    res.status(500).json({ error: 'Failed to create database backup' });
  }
});

export default api;
