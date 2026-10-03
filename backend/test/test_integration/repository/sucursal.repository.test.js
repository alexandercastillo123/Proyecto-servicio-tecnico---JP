/**
 * Tests de integración para sucursal.repository.js.
 *
 * Estrategia:
 *  - Usa la BD de pruebas (servicio_tecnico_test).
 *  - beforeEach trunca las tablas y re-siembra los fixtures base con perfiles.
 *  - Cubre: gestión de tiendas (CRUD, estados, cercanía, propiedad),
 *    catálogo de productos, horarios y reseñas, ciclo completo de pedidos
 *    (creación, pagos, estados, chat de orden) y citas vinculadas a la sucursal.
 */
const repositorySucursal = require('../../../repository/sucursal.repository');
const repositoryAppointment = require('../../../repository/appointment.repository');
const seed = require('../../setup/seed');
const { pool } = require('../../../config/database');

let ids;
let seededStore;

beforeEach(async () => {
    ids = await seed.run({ withProfiles: true });
    seededStore = await repositorySucursal.findByUserId(ids.storeUser);
});

afterAll(async () => {
    try {
        await seed.clear();
    } catch (_) { /* noop */ }
});

describe('sucursal.repository - Stores', () => {
    describe('findAll, findById y findByUserId', () => {
        test('debería listar tiendas activas', async () => {
            const stores = await repositorySucursal.findAll();
            expect(stores.length).toBeGreaterThanOrEqual(1);
            expect(stores.some(s => s.id === seededStore.id)).toBe(true);
        });

        test('findById debería encontrar por id o por user_id', async () => {
            const byStoreId = await repositorySucursal.findById(seededStore.id);
            const byUserId = await repositorySucursal.findById(ids.storeUser);

            expect(byStoreId).not.toBeNull();
            expect(byUserId).not.toBeNull();
            expect(byStoreId.id).toBe(seededStore.id);
            expect(byUserId.id).toBe(seededStore.id);
        });

        test('findByUserId debería devolver la tienda asociada al usuario', async () => {
            const store = await repositorySucursal.findByUserId(ids.storeUser);
            expect(store).not.toBeNull();
            expect(store.name).toBe('Sucursal Test');
        });

        test('existsByUserId debería devolver true si tiene tienda y false si no', async () => {
            expect(await repositorySucursal.existsByUserId(ids.storeUser)).toBe(true);
            expect(await repositorySucursal.existsByUserId(ids.client)).toBe(false);
        });
    });

    describe('create, update, updateStatus y remove', () => {
        test('debería crear una nueva sucursal dentro de una conexión', async () => {
            const conn = await pool.getConnection();
            try {
                // Crear otro usuario para la nueva tienda
                const [userRes] = await conn.query(
                    'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
                    ['tienda2@test.com', 'tienda2_user', 'hash', 'store']
                );
                const newUserId = userRes.insertId;

                await repositorySucursal.create(
                    {
                        userId: newUserId,
                        name: 'Sucursal Norte',
                        description: 'Tienda de cómputo',
                        address: 'Av. Tomas Valle 500',
                        city: 'Lima',
                        state: 'Lima',
                        zip_code: '15002',
                        country: 'Perú',
                        phone: '01-1112233',
                        email: 'norte@test.com',
                    },
                    conn
                );

                const created = await repositorySucursal.findByUserId(newUserId);
                expect(created).not.toBeNull();
                expect(created.name).toBe('Sucursal Norte');
                expect(created.status).toBe('active');
            } finally {
                conn.release();
            }
        });

        test('debería actualizar los campos de la sucursal protegiendo campos restringidos', async () => {
            await repositorySucursal.update(seededStore.id, ids.storeUser, {
                name: 'Sucursal Centro Renombrada',
                phone: '01-9999999',
            });

            const updated = await repositorySucursal.findById(seededStore.id);
            expect(updated.name).toBe('Sucursal Centro Renombrada');
            expect(updated.phone).toBe('01-9999999');
            expect(updated.user_id).toBe(ids.storeUser); // No modificado
        });

        test('debería cambiar el status de la sucursal', async () => {
            await repositorySucursal.updateStatus(seededStore.id, 'inactive');

            const store = await repositorySucursal.findById(seededStore.id);
            expect(store.status).toBe('inactive');

            // No debe figurar en findAll() porque filtra status = 'active'
            const activeList = await repositorySucursal.findAll();
            expect(activeList.some(s => s.id === seededStore.id)).toBe(false);
        });

        test('ownsStore debería validar correctamente la propiedad', async () => {
            expect(await repositorySucursal.ownsStore(seededStore.id, ids.storeUser)).toBe(true);
            expect(await repositorySucursal.ownsStore(seededStore.id, ids.admin)).toBe(false);
        });

        test('remove debería eliminar la sucursal', async () => {
            await repositorySucursal.remove(seededStore.id);

            const deleted = await repositorySucursal.findById(seededStore.id);
            expect(deleted).toBeNull();
        });
    });

    describe('findNearby', () => {
        test('debería encontrar sucursales dentro del radio de geolocalización', async () => {
            await pool.query(
                'UPDATE sucursales SET latitude = -12.046374, longitude = -77.042793 WHERE id = ?',
                [seededStore.id]
            );

            const nearby = await repositorySucursal.findNearby(-12.050000, -77.040000, 5);
            expect(nearby.some(s => s.id === seededStore.id)).toBe(true);

            const farAway = await repositorySucursal.findNearby(-13.500000, -71.900000, 5);
            expect(farAway.some(s => s.id === seededStore.id)).toBe(false);
        });
    });
});

describe('sucursal.repository - Products', () => {
    test('debería insertar, listar, actualizar y eliminar un producto', async () => {
        const prodId = await repositorySucursal.insertProduct({
            sucursal_id: seededStore.id,
            name: 'Mouse Inalámbrico Logitech',
            description: 'Mouse ergonómico',
            price: 65.00,
            image_url: 'mouse.png',
            category: 'Periféricos',
            brand: 'Logitech',
            sku: 'MOU-100',
            is_available: true,
        });

        expect(prodId).toBeGreaterThan(0);

        // getProducts
        const prods = await repositorySucursal.getProducts(seededStore.id);
        expect(prods.some(p => p.id === prodId)).toBe(true);

        // findProductWithStore
        const prodStore = await repositorySucursal.findProductWithStore(prodId);
        expect(prodStore.sucursal_id).toBe(seededStore.id);
        expect(prodStore.user_id).toBe(ids.storeUser);

        // updateProduct
        await repositorySucursal.updateProduct(prodId, { price: 59.90, name: 'Mouse Logitech M185' });
        const conn = await pool.getConnection();
        try {
            const availableForOrder = await repositorySucursal.findProductForOrder(prodId, conn);
            expect(availableForOrder.name).toBe('Mouse Logitech M185');
            expect(Number(availableForOrder.price)).toBe(59.90);
        } finally {
            conn.release();
        }

        // deleteProduct
        await repositorySucursal.deleteProduct(prodId);
        const afterDelete = await repositorySucursal.getProducts(seededStore.id);
        expect(afterDelete.some(p => p.id === prodId)).toBe(false);
    });
});

describe('sucursal.repository - Schedules and Reviews', () => {
    test('getSchedules debería consultar los horarios de la tienda', async () => {
        await pool.query(
            `INSERT INTO store_schedules (sucursal_id, day_of_week, open_time, close_time, is_closed)
             VALUES (?, 'Monday', '09:00:00', '19:00:00', FALSE)`,
            [seededStore.id]
        );

        const schedules = await repositorySucursal.getSchedules(seededStore.id);
        expect(schedules).toHaveLength(1);
        expect(schedules[0].day_of_week).toBe('Monday');
    });

    describe('hasCompletedTransaction, insertReview y recalculateRating', () => {
        test('hasCompletedTransaction debería verificar transacciones de pedidos entregados o citas completadas', async () => {
            // Inicialmente false
            expect(await repositorySucursal.hasCompletedTransaction(ids.client, seededStore.id)).toBe(false);

            // Cita vinculada a sucursal completada
            const conn = await pool.getConnection();
            let apptId;
            try {
                apptId = await repositoryAppointment.create(
                    {
                        clientId: ids.client,
                        technicianId: ids.tech,
                        scheduledDate: '2026-09-10',
                        scheduledTime: '10:00:00',
                        description: 'Servicio en tienda',
                    },
                    conn
                );
                await repositoryAppointment.linkStoreAppointment(seededStore.id, apptId, conn);
            } finally {
                conn.release();
            }

            await repositoryAppointment.updateStatus(apptId, 'completed');

            expect(await repositorySucursal.hasCompletedTransaction(ids.client, seededStore.id)).toBe(true);
        });

        test('debería insertar reseña y recalcular el rating de la tienda', async () => {
            expect(await repositorySucursal.hasExistingReview(ids.client, seededStore.id)).toBe(false);

            await repositorySucursal.insertReview(seededStore.id, ids.client, 5, 'Excelente tienda');
            expect(await repositorySucursal.hasExistingReview(ids.client, seededStore.id)).toBe(true);

            const reviews = await repositorySucursal.getReviews(seededStore.id);
            expect(reviews).toHaveLength(1);
            expect(reviews[0].rating).toBe(5);
            expect(reviews[0].comment).toBe('Excelente tienda');

            await repositorySucursal.recalculateRating(seededStore.id);
            const store = await repositorySucursal.findById(seededStore.id);
            expect(Number(store.rating)).toBe(5.0);
            expect(store.reviews_count).toBe(1);
        });
    });
});

describe('sucursal.repository - Orders', () => {
    let testProductId;

    beforeEach(async () => {
        testProductId = await repositorySucursal.insertProduct({
            sucursal_id: seededStore.id,
            name: 'Teclado Mecánico',
            price: 180.00,
            image_url: 'keyboard.png',
        });
    });

    test('debería crear pedido, asociar producto multi-item y consultar dueño', async () => {
        const conn = await pool.getConnection();
        try {
            const ownerId = await repositorySucursal.findStoreOwner(seededStore.id, conn);
            expect(ownerId).toBe(ids.storeUser);

            const orderId = await repositorySucursal.insertOrder(
                {
                    clientId: ids.client,
                    sucursalId: seededStore.id,
                    productId: testProductId,
                    quantity: 2,
                    unitPrice: 180.00,
                    totalPrice: 360.00,
                    deliveryAddress: 'Av. Pardo 100, Miraflores',
                },
                conn
            );

            await repositorySucursal.insertOrderProduct(orderId, testProductId, 2, 180.00, conn);

            expect(orderId).toBeGreaterThan(0);

            const order = await repositorySucursal.findOrderById(orderId);
            expect(order).not.toBeNull();
            expect(order.product_name).toBe('Teclado Mecánico');
            expect(Number(order.total_price)).toBe(360.00);

            const orderWithEmail = await repositorySucursal.findOrderWithEmail(orderId);
            expect(orderWithEmail.email).toBe('cliente@test.com');
        } finally {
            conn.release();
        }
    });

    test('debería gestionar flujo de pago de pedidos (waiting, confirm, culqi)', async () => {
        const conn = await pool.getConnection();
        let orderId;
        try {
            orderId = await repositorySucursal.insertOrder(
                {
                    clientId: ids.client,
                    sucursalId: seededStore.id,
                    productId: testProductId,
                    quantity: 1,
                    unitPrice: 180.00,
                    totalPrice: 180.00,
                },
                conn
            );
        } finally {
            conn.release();
        }

        // updateOrderPaymentWaiting
        await repositorySucursal.updateOrderPaymentWaiting(orderId, 'yape');
        let order = await repositorySucursal.findOrderById(orderId);
        expect(order.payment_method).toBe('yape');
        expect(order.payment_status).toBe('waiting_confirmation');

        // confirmOrderPayment
        await repositorySucursal.confirmOrderPayment(orderId);
        order = await repositorySucursal.findOrderById(orderId);
        expect(order.payment_status).toBe('paid');
        expect(order.status).toBe('confirmed');

        // confirmOrderPaymentCulqi
        await repositorySucursal.confirmOrderPaymentCulqi(orderId, 'chr_culqi_order_123');
        order = await repositorySucursal.findOrderById(orderId);
        expect(order.payment_method).toBe('culqi');
        expect(order.culqi_charge_id).toBe('chr_culqi_order_123');
        expect(order.payment_status).toBe('paid');
    });

    test('debería listar pedidos del cliente (findMyOrders) y de la tienda (findStoreOrders)', async () => {
        const conn = await pool.getConnection();
        let orderId;
        try {
            orderId = await repositorySucursal.insertOrder(
                {
                    clientId: ids.client,
                    sucursalId: seededStore.id,
                    productId: testProductId,
                    quantity: 1,
                    unitPrice: 180.00,
                    totalPrice: 180.00,
                },
                conn
            );
        } finally {
            conn.release();
        }

        const myOrders = await repositorySucursal.findMyOrders(ids.client);
        expect(myOrders.some(o => o.id === orderId)).toBe(true);

        const storeOrders = await repositorySucursal.findStoreOrders(seededStore.id);
        expect(storeOrders.some(o => o.id === orderId)).toBe(true);
        expect(storeOrders[0].client_names).toBe('Juan');
    });

    test('debería actualizar estado de pedido (updateOrderStatus y findOrderForStatus)', async () => {
        const conn = await pool.getConnection();
        try {
            const orderId = await repositorySucursal.insertOrder(
                {
                    clientId: ids.client,
                    sucursalId: seededStore.id,
                    productId: testProductId,
                    quantity: 1,
                    unitPrice: 180.00,
                    totalPrice: 180.00,
                },
                conn
            );

            await repositorySucursal.updateOrderStatus(orderId, 'shipped', conn);
            const order = await repositorySucursal.findOrderForStatus(orderId, conn);
            expect(order.status).toBe('shipped');
        } finally {
            conn.release();
        }
    });

    test('debería insertar mensaje de chat asociado al pedido', async () => {
        const conn = await pool.getConnection();
        let orderId;
        try {
            orderId = await repositorySucursal.insertOrder(
                {
                    clientId: ids.client,
                    sucursalId: seededStore.id,
                    productId: testProductId,
                    quantity: 1,
                    unitPrice: 180.00,
                    totalPrice: 180.00,
                },
                conn
            );

            // insertOrderChatMessage
            await repositorySucursal.insertOrderChatMessage(ids.client, ids.storeUser, 'Consulta sobre el envío', orderId);

            // insertOrderChatMessageConn
            await repositorySucursal.insertOrderChatMessageConn(conn, ids.storeUser, ids.client, 'El pedido saldrá mañana', orderId);
        } finally {
            conn.release();
        }

        const [rows] = await pool.query('SELECT * FROM chat_messages WHERE order_id = ? ORDER BY id ASC', [orderId]);
        expect(rows).toHaveLength(2);
        expect(rows[0].message_text).toBe('Consulta sobre el envío');
        expect(rows[0].message_type).toBe('order');
        expect(rows[1].message_text).toBe('El pedido saldrá mañana');
    });
});

describe('sucursal.repository - Store Appointments', () => {
    test('findStoreAppointments debería listar citas asociadas a la sucursal', async () => {
        const conn = await pool.getConnection();
        let apptId;
        try {
            apptId = await repositoryAppointment.create(
                {
                    clientId: ids.client,
                    technicianId: ids.tech,
                    scheduledDate: '2026-10-30',
                    scheduledTime: '15:00:00',
                    description: 'Atención física en local',
                },
                conn
            );
            await repositoryAppointment.linkStoreAppointment(seededStore.id, apptId, conn);
        } finally {
            conn.release();
        }

        const storeAppts = await repositorySucursal.findStoreAppointments(seededStore.id);
        expect(storeAppts.length).toBeGreaterThanOrEqual(1);
        const found = storeAppts.find(a => a.id === apptId);
        expect(found).toBeDefined();
        expect(found.client_names).toBe('Juan');
        expect(found.tech_names).toBe('María');
    });
});
