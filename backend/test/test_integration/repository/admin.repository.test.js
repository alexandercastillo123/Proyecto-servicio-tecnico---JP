/**
 * Tests de integración para admin.repository.js.
 *
 * Estrategia:
 *  - Usa la BD de pruebas (servicio_tecnico_test).
 *  - beforeEach trunca las tablas y re-siembra los fixtures base con perfiles.
 *  - Valida las consultas complejas de administración: todas las citas con filtros,
 *    todos los usuarios por rol, todas las sucursales con datos del dueño y pedidos de tienda.
 */
const repositoryAdmin = require('../../../repository/admin.repository');
const repositoryAppointment = require('../../../repository/appointment.repository');
const repositorySucursal = require('../../../repository/sucursal.repository');
const seed = require('../../setup/seed');
const { pool } = require('../../../config/database');

let ids;

beforeEach(async () => {
    ids = await seed.run({ withProfiles: true });
});

afterAll(async () => {
    try {
        await seed.clear();
    } catch (_) { /* noop */ }
});

describe('admin.repository - getAllAppointments', () => {
    test('debería listar todas las citas con datos unidos de cliente, técnico y sucursal', async () => {
        const conn = await pool.getConnection();
        let apptId;
        try {
            apptId = await repositoryAppointment.create(
                {
                    clientId: ids.client,
                    technicianId: ids.tech,
                    scheduledDate: '2026-10-20',
                    scheduledTime: '10:00:00',
                    description: 'Revisión técnica',
                    serviceType: 'local',
                },
                conn
            );
            const store = await repositoryAppointment.findStoreByUserId(ids.storeUser, conn);
            await repositoryAppointment.linkStoreAppointment(store.id, apptId, conn);
        } finally {
            conn.release();
        }

        const list = await repositoryAdmin.getAllAppointments();

        expect(list.length).toBeGreaterThanOrEqual(1);
        const found = list.find(a => a.id === apptId);
        expect(found).toBeDefined();
        expect(found.client_username).toBe('cliente_test');
        expect(found.client_names).toBe('Juan');
        expect(found.tech_username).toBe('tecnico_test');
        expect(found.tech_names).toBe('María');
        expect(found.store_name).toBe('Sucursal Test');
    });

    test('debería filtrar citas por status', async () => {
        const conn = await pool.getConnection();
        try {
            const id1 = await repositoryAppointment.create(
                {
                    clientId: ids.client,
                    technicianId: ids.tech,
                    scheduledDate: '2026-10-21',
                    scheduledTime: '11:00:00',
                    description: 'Cita pendiente',
                },
                conn
            );
            const id2 = await repositoryAppointment.create(
                {
                    clientId: ids.client,
                    technicianId: ids.tech,
                    scheduledDate: '2026-10-22',
                    scheduledTime: '12:00:00',
                    description: 'Cita confirmada',
                },
                conn
            );
            await repositoryAppointment.updateStatus(id2, 'confirmed');

            const pending = await repositoryAdmin.getAllAppointments({ status: 'pending' });
            const confirmed = await repositoryAdmin.getAllAppointments({ status: 'confirmed' });

            expect(pending.some(a => a.id === id1)).toBe(true);
            expect(pending.some(a => a.id === id2)).toBe(false);

            expect(confirmed.some(a => a.id === id1)).toBe(false);
            expect(confirmed.some(a => a.id === id2)).toBe(true);
        } finally {
            conn.release();
        }
    });

    test('debería filtrar citas por fecha programada (date)', async () => {
        const conn = await pool.getConnection();
        try {
            const id = await repositoryAppointment.create(
                {
                    clientId: ids.client,
                    technicianId: ids.tech,
                    scheduledDate: '2026-12-25',
                    scheduledTime: '09:30:00',
                    description: 'Cita navidad',
                },
                conn
            );

            const matched = await repositoryAdmin.getAllAppointments({ date: '2026-12-25' });
            const notMatched = await repositoryAdmin.getAllAppointments({ date: '2026-12-26' });

            expect(matched.some(a => a.id === id)).toBe(true);
            expect(notMatched.some(a => a.id === id)).toBe(false);
        } finally {
            conn.release();
        }
    });
});

describe('admin.repository - getAllUsers', () => {
    test('debería listar todos los usuarios con sus perfiles correspondientes', async () => {
        const users = await repositoryAdmin.getAllUsers();

        expect(users.length).toBeGreaterThanOrEqual(4);
        const adminUser = users.find(u => u.id === ids.admin);
        const techUser = users.find(u => u.id === ids.tech);

        expect(adminUser).toBeDefined();
        expect(adminUser.role).toBe('admin');
        expect(adminUser.names).toBe('Administrador');

        expect(techUser).toBeDefined();
        expect(techUser.role).toBe('tech');
        expect(techUser.names).toBe('María');
        expect(techUser.surnames).toBe('García');
    });

    test('debería filtrar usuarios por rol', async () => {
        const clients = await repositoryAdmin.getAllUsers({ role: 'client' });
        const techs = await repositoryAdmin.getAllUsers({ role: 'tech' });
        const stores = await repositoryAdmin.getAllUsers({ role: 'store' });

        expect(clients.every(u => u.role === 'client')).toBe(true);
        expect(techs.every(u => u.role === 'tech')).toBe(true);
        expect(stores.every(u => u.role === 'store')).toBe(true);

        expect(clients.some(u => u.id === ids.client)).toBe(true);
        expect(techs.some(u => u.id === ids.tech)).toBe(true);
        expect(stores.some(u => u.id === ids.storeUser)).toBe(true);
    });
});

describe('admin.repository - getAllBranches', () => {
    test('debería listar sucursales incluyendo datos del usuario propietario', async () => {
        const branches = await repositoryAdmin.getAllBranches();

        expect(branches.length).toBeGreaterThanOrEqual(1);
        const branch = branches.find(b => b.user_id === ids.storeUser);

        expect(branch).toBeDefined();
        expect(branch.name).toBe('Sucursal Test');
        expect(branch.owner_username).toBe('tienda_test');
        expect(branch.owner_email).toBe('tienda@test.com');
        expect(branch.city).toBe('Lima');
    });
});

describe('admin.repository - getAllOrders', () => {
    test('debería listar pedidos de tienda con joins de producto, sucursal y cliente', async () => {
        // Crear producto y pedido
        const branch = await repositorySucursal.findByUserId(ids.storeUser);
        const prodId = await repositorySucursal.insertProduct({
            sucursal_id: branch.id,
            name: 'Disco SSD 1TB',
            description: 'NVMe Kingston',
            price: 280.00,
            image_url: 'ssd.png',
            category: 'Almacenamiento',
            brand: 'Kingston',
            sku: 'SSD-100',
            is_available: true,
        });

        const conn = await pool.getConnection();
        let orderId;
        try {
            orderId = await repositorySucursal.insertOrder(
                {
                    clientId: ids.client,
                    sucursalId: branch.id,
                    productId: prodId,
                    quantity: 1,
                    unitPrice: 280.00,
                    totalPrice: 280.00,
                    deliveryAddress: 'Av. Arequipa 1234',
                    latitude: -12.0463,
                    longitude: -77.0427,
                },
                conn
            );
        } finally {
            conn.release();
        }

        const orders = await repositoryAdmin.getAllOrders();

        expect(orders.length).toBeGreaterThanOrEqual(1);
        const order = orders.find(o => o.id === orderId);
        expect(order).toBeDefined();
        expect(order.product_name).toBe('Disco SSD 1TB');
        expect(order.store_name).toBe('Sucursal Test');
        expect(order.client_names).toBe('Juan');
        expect(order.client_surnames).toBe('Pérez');
        expect(Number(order.total_price)).toBe(280.00);
        expect(order.status).toBe('pending');
    });

    test('debería filtrar pedidos por status', async () => {
        const branch = await repositorySucursal.findByUserId(ids.storeUser);
        const prodId = await repositorySucursal.insertProduct({
            sucursal_id: branch.id,
            name: 'Memoria RAM 16GB',
            price: 150.00,
        });

        const conn = await pool.getConnection();
        try {
            const orderId = await repositorySucursal.insertOrder(
                {
                    clientId: ids.client,
                    sucursalId: branch.id,
                    productId: prodId,
                    quantity: 1,
                    unitPrice: 150.00,
                    totalPrice: 150.00,
                },
                conn
            );
            await repositorySucursal.updateOrderStatus(orderId, 'delivered', conn);

            const delivered = await repositoryAdmin.getAllOrders({ status: 'delivered' });
            const pending = await repositoryAdmin.getAllOrders({ status: 'pending' });

            expect(delivered.some(o => o.id === orderId)).toBe(true);
            expect(pending.some(o => o.id === orderId)).toBe(false);
        } finally {
            conn.release();
        }
    });
});
