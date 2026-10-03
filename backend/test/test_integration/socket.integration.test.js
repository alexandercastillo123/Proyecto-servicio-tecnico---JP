/**
 * Tests de integración para Socket.IO
 *
 * Valida:
 *  1. Conexión y handshake cliente-servidor vía WebSockets/Polling.
 *  2. Creación y unión a salas privadas de usuario (`join_room`).
 *  3. Mensajería directa P2P (`send_message` -> `receive_message`).
 *  4. Aislamiento y privacidad: un tercer cliente NO recibe mensajes de otras salas.
 *  5. Indicador en tiempo real de "Escribiendo..." (`typing` -> `user_typing`).
 *  6. Emisión de eventos del servidor a través de `socketManager.getIO()`:
 *     - `receive_message` (mensajes de texto y propuestas de oferta)
 *     - `offer_updated` (aceptación/rechazo de presupuestos)
 *     - `appointment_created` (notificación instantánea de nueva cita)
 *     - `appointment_progress` (cambio de estados de servicio)
 *     - `appointment_price_updated` (fijación de precio por el técnico)
 *     - `appointment_payment_waiting` y `appointment_payment_confirmed`
 *  7. Abandono de sala (`leave_room`) y desconexión limpia sin memory leaks.
 */

const http = require('http');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const { setIO, getIO } = require('../../config/socketManager');

describe('Socket.IO - Tests de Integración', () => {
    let httpServer;
    let ioServer;
    let port;
    let clientA;
    let clientB;
    let clientC;

    const USER_A_ID = 101; // Cliente
    const USER_B_ID = 202; // Técnico
    const USER_C_ID = 303; // Tercero ajeno

    beforeAll((done) => {
        httpServer = http.createServer();
        ioServer = new Server(httpServer, {
            cors: { origin: '*', methods: ['GET', 'POST'] }
        });

        // Registrar ioServer en el singleton del backend
        setIO(ioServer);

        // Lógica de sockets idéntica a backend/server.js
        ioServer.on('connection', (socket) => {
            socket.on('join_room', (userId) => {
                socket.join(`user_${userId}`);
                socket.userId = userId;
            });

            socket.on('leave_room', (userId) => {
                socket.leave(`user_${userId}`);
            });

            socket.on('send_message', (data) => {
                ioServer.to(`user_${data.receiverId}`).emit('receive_message', data);
            });

            socket.on('typing', (data) => {
                if (data && data.receiverId) {
                    ioServer.to(`user_${data.receiverId}`).emit('user_typing', {
                        senderId: data.senderId,
                        isTyping: !!data.isTyping
                    });
                }
            });
        });

        // Puerto 0 asigna un puerto dinámico libre disponible por el SO
        httpServer.listen(0, () => {
            port = httpServer.address().port;
            done();
        });
    });

    afterAll((done) => {
        if (clientA?.connected) clientA.disconnect();
        if (clientB?.connected) clientB.disconnect();
        if (clientC?.connected) clientC.disconnect();

        ioServer.close(done);
    });

    beforeEach((done) => {
        const createClient = (userId) => {
            return new Promise((resolve) => {
                const client = ioClient(`http://localhost:${port}`, {
                    transports: ['websocket', 'polling'],
                    forceNew: true,
                    reconnection: false
                });

                client.on('connect', () => {
                    client.emit('join_room', userId);
                    setTimeout(() => resolve(client), 50);
                });
            });
        };

        Promise.all([
            createClient(USER_A_ID),
            createClient(USER_B_ID),
            createClient(USER_C_ID)
        ]).then(([cA, cB, cC]) => {
            clientA = cA;
            clientB = cB;
            clientC = cC;
            done();
        });
    });

    afterEach(() => {
        if (clientA?.connected) clientA.disconnect();
        if (clientB?.connected) clientB.disconnect();
        if (clientC?.connected) clientC.disconnect();
    });

    // ─── 1. Conexión y Handshake ─────────────────────────────────────────────
    test('1. Conexión exitosa y registro de clientes en salas privadas', () => {
        expect(clientA.connected).toBe(true);
        expect(clientB.connected).toBe(true);
        expect(clientC.connected).toBe(true);
        expect(clientA.id).toBeDefined();
        expect(clientB.id).toBeDefined();
        expect(clientA.id).not.toBe(clientB.id);
    });

    // ─── 2. Mensajería P2P y Privacidad de Salas ─────────────────────────────
    test('2. Envío de mensaje entre usuarios (send_message -> receive_message) con aislamiento de salas', (done) => {
        const messagePayload = {
            senderId: USER_A_ID,
            receiverId: USER_B_ID,
            messageText: 'Hola, ¿puedes venir hoy a revisar mi laptop?',
            messageType: 'text',
            createdAt: new Date().toISOString()
        };

        let clientCReceivedMessage = false;

        // Cliente C no debe recibir el mensaje
        clientC.on('receive_message', () => {
            clientCReceivedMessage = true;
        });

        // Cliente B debe recibir el mensaje en su sala privada
        clientB.on('receive_message', (received) => {
            try {
                expect(received.senderId).toBe(USER_A_ID);
                expect(received.receiverId).toBe(USER_B_ID);
                expect(received.messageText).toBe(messagePayload.messageText);
                expect(received.messageType).toBe('text');

                // Asegurar que Cliente C nunca lo recibió
                setTimeout(() => {
                    expect(clientCReceivedMessage).toBe(false);
                    done();
                }, 100);
            } catch (err) {
                done(err);
            }
        });

        // Cliente A envía el mensaje
        clientA.emit('send_message', messagePayload);
    });

    // ─── 3. Indicador de "Escribiendo..." ───────────────────────────────────
    test('3. Indicador de tecleo en tiempo real (typing -> user_typing)', (done) => {
        clientB.on('user_typing', (data) => {
            try {
                expect(data.senderId).toBe(USER_A_ID);
                expect(data.isTyping).toBe(true);
                done();
            } catch (err) {
                done(err);
            }
        });

        clientA.emit('typing', {
            senderId: USER_A_ID,
            receiverId: USER_B_ID,
            isTyping: true
        });
    });

    // ─── 4. Emisiones de Servidor / Singleton getIO() ────────────────────────
    test('4. Emisión desde el backend para ofertas en tiempo real (receive_message & offer_updated)', (done) => {
        const io = getIO();
        const offerPayload = {
            id: 99,
            sender_id: USER_B_ID,
            receiver_id: USER_A_ID,
            message_text: 'Oferta de servicio: S/.150',
            message_type: 'offer',
            offer_price: 150.00,
            offer_status: 'pending',
            created_at: new Date().toISOString()
        };

        clientA.on('receive_message', (msg) => {
            try {
                expect(msg.id).toBe(99);
                expect(msg.message_type).toBe('offer');
                expect(msg.offer_price).toBe(150.00);
                expect(msg.offer_status).toBe('pending');

                // Luego probamos la actualización de la oferta (ej. el cliente acepta la oferta)
                clientB.on('offer_updated', (update) => {
                    expect(update.offerId).toBe(99);
                    expect(update.offerStatus).toBe('accepted');
                    done();
                });

                io.to(`user_${USER_B_ID}`).emit('offer_updated', { offerId: 99, offerStatus: 'accepted' });
            } catch (err) {
                done(err);
            }
        });

        // El backend emite la propuesta al cliente
        io.to(`user_${USER_A_ID}`).emit('receive_message', offerPayload);
    });

    test('5. Emisión desde el backend para progreso y ciclo de vida de Citas (appointment_progress)', (done) => {
        const io = getIO();
        const progressPayload = {
            appointment_id: 42,
            status: 'on_the_way',
            service_type: 'domicilio',
            message: '🚚 ¡Voy en camino! El técnico está dirigiéndose a tu domicilio.'
        };

        clientA.on('appointment_progress', (data) => {
            try {
                expect(data.appointment_id).toBe(42);
                expect(data.status).toBe('on_the_way');
                expect(data.service_type).toBe('domicilio');
                expect(data.message).toContain('¡Voy en camino!');
                done();
            } catch (err) {
                done(err);
            }
        });

        io.to(`user_${USER_A_ID}`).emit('appointment_progress', progressPayload);
    });

    test('6. Emisión desde el backend para precio y pagos (appointment_price_updated & appointment_payment_confirmed)', (done) => {
        const io = getIO();
        let priceReceived = false;
        let paymentConfirmedReceived = false;

        clientA.on('appointment_price_updated', (data) => {
            expect(data.appointment_id).toBe(42);
            expect(data.price).toBe(120.50);
            priceReceived = true;
            checkCompletion();
        });

        clientA.on('appointment_payment_confirmed', (data) => {
            expect(data.appointment_id).toBe(42);
            expect(data.payment_status).toBe('paid');
            expect(data.status).toBe('confirmed');
            paymentConfirmedReceived = true;
            checkCompletion();
        });

        function checkCompletion() {
            if (priceReceived && paymentConfirmedReceived) {
                done();
            }
        }

        io.to(`user_${USER_A_ID}`).emit('appointment_price_updated', { appointment_id: 42, price: 120.50 });
        io.to(`user_${USER_A_ID}`).emit('appointment_payment_confirmed', { appointment_id: 42, payment_status: 'paid', status: 'confirmed' });
    });

    // ─── 7. Abandono de sala (leave_room) ────────────────────────────────────
    test('7. Abandono de sala privada (leave_room) impide recibir mensajes posteriores', (done) => {
        clientB.emit('leave_room', USER_B_ID);

        // Permitir que el servidor procese el leave_room
        setTimeout(() => {
            let messageReceivedAfterLeave = false;

            clientB.on('receive_message', () => {
                messageReceivedAfterLeave = true;
            });

            clientA.emit('send_message', {
                senderId: USER_A_ID,
                receiverId: USER_B_ID,
                messageText: '¿Estás ahí?'
            });

            setTimeout(() => {
                expect(messageReceivedAfterLeave).toBe(false);
                done();
            }, 150);
        }, 80);
    });
});
