/**
 * messages.endpoint.test.js
 * Pruebas de integración de endpoints para /api/messages usando Supertest
 */

const mockQuery = jest.fn();

jest.mock('../../config/database', () => ({
    pool: {
        query: mockQuery
    }
}));

jest.mock('../../services/notification.service');

const notificationService = require('../../services/notification.service');
const { request, app, clientToken, authHeader } = require('../setup/endpoint-helper');

describe('Endpoints: /api/messages', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.mockReset();
    });

    describe('GET /api/messages/conversations', () => {
        test('debería retornar 401 si no está autenticado', async () => {
            const res = await request(app).get('/api/messages/conversations');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 200 y lista de conversaciones', async () => {
            const mockConversations = [
                { other_user_id: 20, names: 'Pedro', last_message_text: 'Hola' }
            ];
            mockQuery.mockResolvedValue([mockConversations]);

            const res = await request(app)
                .get('/api/messages/conversations')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockConversations);
        });
    });

    describe('GET /api/messages/:otherUserId', () => {
        test('debería retornar 200 y el historial de mensajes con otro usuario', async () => {
            const mockMessages = [
                { id: 1, sender_id: 10, receiver_id: 20, message_text: 'Hola, tengo una consulta' }
            ];
            // 1st query: SELECT messages, 2nd query: UPDATE chat_messages SET is_read
            mockQuery
                .mockResolvedValueOnce([mockMessages])
                .mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .get('/api/messages/20')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockMessages);
        });
    });

    describe('POST /api/messages', () => {
        test('debería retornar 201 al enviar un mensaje de texto correctamente', async () => {
            // 1st query: receiver check
            // 2nd query: insert chat_messages
            // 3rd query: sender profile for notification
            mockQuery
                .mockResolvedValueOnce([[{ id: 20 }]])
                .mockResolvedValueOnce([{ insertId: 77 }])
                .mockResolvedValueOnce([[{ names: 'Juan' }]]);

            notificationService.createNotification.mockResolvedValue(true);

            const res = await request(app)
                .post('/api/messages')
                .set(authHeader(clientToken))
                .send({
                    receiverId: 20,
                    messageText: 'Buenas tardes'
                });

            expect(res.status).toBe(201);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual({ messageId: 77 });
        });

        test('debería retornar 400 si falta el texto del mensaje', async () => {
            const res = await request(app)
                .post('/api/messages')
                .set(authHeader(clientToken))
                .send({
                    receiverId: 20
                });

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });

        test('debería retornar 404 si el destinatario no existe', async () => {
            mockQuery.mockResolvedValueOnce([[]]);

            const res = await request(app)
                .post('/api/messages')
                .set(authHeader(clientToken))
                .send({
                    receiverId: 9999,
                    messageText: 'Hola'
                });

            expect(res.status).toBe(404);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('DELETE /api/messages/:id', () => {
        test('debería retornar 200 al eliminar lógicamente un mensaje propio', async () => {
            mockQuery
                .mockResolvedValueOnce([[{ id: 1, sender_id: 10, receiver_id: 20 }]])
                .mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .delete('/api/messages/1')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
        });
    });
});
