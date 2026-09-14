import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  /**
   * Conectar a Socket.IO con el ID del usuario y el token de autenticación
   */
  connect(userId, authToken) {
    if (this.socket && this.isConnected && this.userId === userId) {
      return this.socket;
    }

    if (this.socket) {
      this.disconnect();
    }

    this.userId = userId;

    // Detect URL: en desarrollo usa el proxy de Vite o puerto 3000
    const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:3000'
      : window.location.origin;

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      extraHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`⚡ [SocketService] Conectado con ID: ${this.socket.id}`);
      
      // Unirse al cuarto privado del usuario
      if (this.userId) {
        this.socket.emit('join_room', this.userId);
        console.log(`📡 [SocketService] Unido a sala privada: user_${this.userId}`);
      }

      this._notifyListeners('connection_status', { connected: true, socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`🔌 [SocketService] Desconectado. Razón: ${reason}`);
      this._notifyListeners('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.warn(`⚠️ [SocketService] Error de conexión: ${error.message}`);
      this._notifyListeners('connection_error', error);
    });

    // Eventos de negocio en tiempo real
    this.socket.on('receive_message', (data) => {
      console.log('💬 [SocketService] Mensaje recibido:', data);
      this._notifyListeners('receive_message', data);
    });

    this.socket.on('appointment_progress', (data) => {
      console.log('📅 [SocketService] Progreso de cita:', data);
      this._notifyListeners('appointment_progress', data);
    });

    this.socket.on('appointment_created', (data) => {
      console.log('✨ [SocketService] Nueva cita creada:', data);
      this._notifyListeners('appointment_created', data);
    });

    this.socket.on('offer_updated', (data) => {
      console.log('🏷️ [SocketService] Oferta actualizada:', data);
      this._notifyListeners('offer_updated', data);
    });

    this.socket.on('appointment_price_updated', (data) => {
      console.log('💰 [SocketService] Precio actualizado:', data);
      this._notifyListeners('appointment_price_updated', data);
    });

    this.socket.on('appointment_payment_waiting', (data) => {
      console.log('⏳ [SocketService] Pago en espera:', data);
      this._notifyListeners('appointment_payment_waiting', data);
    });

    this.socket.on('appointment_payment_confirmed', (data) => {
      console.log('✅ [SocketService] Pago confirmado:', data);
      this._notifyListeners('appointment_payment_confirmed', data);
    });

    this.socket.on('user_typing', (data) => {
      this._notifyListeners('user_typing', data);
    });

    return this.socket;
  }

  /**
   * Enviar mensaje por socket
   */
  sendMessage(messageData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', messageData);
    }
  }

  /**
   * Emitir evento de 'escribiendo...'
   */
  emitTyping(receiverId, isTyping) {
    if (this.socket && this.isConnected && this.userId) {
      this.socket.emit('typing', {
        senderId: this.userId,
        receiverId,
        isTyping
      });
    }
  }

  /**
   * Suscribirse a un evento
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Retornar función de desuscripción limpia
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Notificar a todos los callbacks registrados para un evento
   */
  _notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error en listener de ${event}:`, err);
        }
      });
    }
  }

  /**
   * Desconectar socket y limpiar
   */
  disconnect() {
    if (this.socket) {
      if (this.userId) {
        this.socket.emit('leave_room', this.userId);
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.userId = null;
  }
}

const socketService = new SocketService();
export default socketService;
