import 'package:camera/camera.dart';

class CameraService {
  static final CameraService _instance = CameraService._internal();
  factory CameraService() => _instance;
  CameraService._internal();

  List<CameraDescription> _cameras = [];
  CameraController? _controller;

  Future<void> initialize() async {
    _cameras = await availableCameras();
  }

  Future<CameraController?> getController() async {
    if (_cameras.isEmpty) await initialize();
    if (_cameras.isEmpty) return null;

    if (_controller != null) await _controller!.dispose();

    _controller = CameraController(
      _cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => _cameras.first,
      ),
      ResolutionPreset.medium,
      enableAudio: false,
    );

    await _controller!.initialize();
    return _controller;
  }

  Future<XFile?> takePicture() async {
    if (_controller == null || !_controller!.value.isInitialized) return null;
    return await _controller!.takePicture();
  }

  void dispose() {
    _controller?.dispose();
    _controller = null;
  }
}
