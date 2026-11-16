import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:servicio_tecnico_app/core/services/socket_service.dart';

void main() {
  group('SocketService - Listeners adicionales', () {
    late SocketService socketService;

    setUp(() {
      socketService = SocketService();
      // Reset state between tests without re-initializing socket connection
      if (socketService.initialized) {
        socketService.dispose();
      }
    });

    tearDown(() {
      if (socketService.initialized) {
        socketService.dispose();
      }
    });

    test('deberia exponer streams para todos los eventos nuevos', () {
      expect(socketService.onAppointmentCreated, isA<Stream>());
      expect(socketService.onOfferUpdated, isA<Stream>());
      expect(socketService.onPriceUpdated, isA<Stream>());
      expect(socketService.onPaymentWaiting, isA<Stream>());
      expect(socketService.onPaymentConfirmed, isA<Stream>());
      expect(socketService.onUserTyping, isA<Stream>());
    });

    // ── Helper to simulate socket events for testing ──────────────────────────
  void simulateEvent(String event, Map<String, dynamic> data) {
    socketService.simulateEventForTesting(event, data);
  }

    test('onAppointmentCreated deberia recibir datos del evento appointment_created', () async {
      final completer = Completer<Map<String, dynamic>>();

      socketService.onAppointmentCreated.listen((data) {
        if (!completer.isCompleted) {
          completer.complete(data);
        }
      });

      final testData = {
        'appointment_id': 42,
        'client_id': 101,
        'technician_id': 202,
        'scheduled_date': '2025-01-15',
        'scheduled_time': '10:00:00',
        'description': 'Reparacion de pantalla',
        'service_type': 'domicilio',
        'status': 'pending',
      };

      simulateEvent('appointment_created', testData);

      final result = await completer.future;
      expect(result['appointment_id'], 42);
      expect(result['service_type'], 'domicilio');
      expect(result['status'], 'pending');
    });

    test('onOfferUpdated deberia recibir datos del evento offer_updated', () async {
      final completer = Completer<Map<String, dynamic>>();

      socketService.onOfferUpdated.listen((data) {
        if (!completer.isCompleted) {
          completer.complete(data);
        }
      });

      final testData = {
        'offerId': 99,
        'offerStatus': 'accepted',
      };

      simulateEvent('offer_updated', testData);

      final result = await completer.future;
      expect(result['offerId'], 99);
      expect(result['offerStatus'], 'accepted');
    });

    test('onPriceUpdated deberia recibir datos del evento appointment_price_updated', () async {
      final completer = Completer<Map<String, dynamic>>();

      socketService.onPriceUpdated.listen((data) {
        if (!completer.isCompleted) {
          completer.complete(data);
        }
      });

      final testData = {
        'appointment_id': 42,
        'price': 150.0,
      };

      simulateEvent('appointment_price_updated', testData);

      final result = await completer.future;
      expect(result['appointment_id'], 42);
      expect(result['price'], 150.0);
    });

    test('onPaymentWaiting deberia recibir datos del evento appointment_payment_waiting', () async {
      final completer = Completer<Map<String, dynamic>>();

      socketService.onPaymentWaiting.listen((data) {
        if (!completer.isCompleted) {
          completer.complete(data);
        }
      });

      final testData = {
        'appointment_id': 42,
        'payment_status': 'waiting_confirmation',
        'payment_method': 'culqi',
      };

      simulateEvent('appointment_payment_waiting', testData);

      final result = await completer.future;
      expect(result['payment_status'], 'waiting_confirmation');
      expect(result['payment_method'], 'culqi');
    });

    test('onPaymentConfirmed deberia recibir datos del evento appointment_payment_confirmed', () async {
      final completer = Completer<Map<String, dynamic>>();

      socketService.onPaymentConfirmed.listen((data) {
        if (!completer.isCompleted) {
          completer.complete(data);
        }
      });

      final testData = {
        'appointment_id': 42,
        'payment_status': 'paid',
        'status': 'confirmed',
      };

      simulateEvent('appointment_payment_confirmed', testData);

      final result = await completer.future;
      expect(result['payment_status'], 'paid');
      expect(result['status'], 'confirmed');
    });

    test('onUserTyping deberia recibir datos del evento user_typing', () async {
      final completer = Completer<Map<String, dynamic>>();

      socketService.onUserTyping.listen((data) {
        if (!completer.isCompleted) {
          completer.complete(data);
        }
      });

      final testData = {
        'senderId': 101,
        'receiverId': 202,
        'isTyping': true,
      };

      simulateEvent('user_typing', testData);

      final result = await completer.future;
      expect(result['senderId'], 101);
      expect(result['receiverId'], 202);
      expect(result['isTyping'], isTrue);
    });

    test('onMessageReceived deberia seguir funcionando para eventos existentes', () async {
      final completer = Completer<Map<String, dynamic>>();

      socketService.onMessageReceived.listen((data) {
        if (!completer.isCompleted) {
          completer.complete(data);
        }
      });

      final testData = {
        'senderId': 101,
        'receiverId': 202,
        'messageText': 'Hola!',
        'messageType': 'text',
      };

      simulateEvent('receive_message', testData);

      final result = await completer.future;
      expect(result['messageText'], 'Hola!');
    });

    test('onAppointmentUpdate deberia seguir funcionando para eventos existentes', () async {
      final completer = Completer<Map<String, dynamic>>();

      socketService.onAppointmentUpdate.listen((data) {
        if (!completer.isCompleted) {
          completer.complete(data);
        }
      });

      final testData = {
        'appointment_id': 42,
        'status': 'on_the_way',
        'service_type': 'domicilio',
      };

      simulateEvent('appointment_progress', testData);

      final result = await completer.future;
      expect(result['appointment_id'], 42);
      expect(result['status'], 'on_the_way');
    });

    test('los streams deberian ser multi-suscriptores (broadcast)', () async {
      final received1 = <Map<String, dynamic>>[];
      final received2 = <Map<String, dynamic>>[];

      final sub1 = socketService.onAppointmentCreated.listen(received1.add);
      final sub2 = socketService.onAppointmentCreated.listen(received2.add);

      socketService.simulateEventForTesting('appointment_created', {
        'appointment_id': 1,
        'status': 'confirmed',
      });

      // Los eventos en streams broadcast se entregan asincronamente
      await Future.delayed(Duration(milliseconds: 100));

      expect(received1, isNotEmpty);
      expect(received2, isNotEmpty);

      sub1.cancel();
      sub2.cancel();
    });
  });
}
