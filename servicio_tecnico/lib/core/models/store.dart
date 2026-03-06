class Store {
  final int id;
  final int userId;
  final String name;
  final String address;
  final String city;
  final String state;
  final String zipCode;
  final String country;
  final String phone;
  final String email;
  final double? latitude;
  final double? longitude;
  final String status;
  final double? distanceKm;

  Store({
    required this.id,
    required this.userId,
    required this.name,
    required this.address,
    required this.city,
    required this.state,
    required this.zipCode,
    required this.country,
    required this.phone,
    required this.email,
    this.latitude,
    this.longitude,
    required this.status,
    this.distanceKm,
  });

  factory Store.fromJson(Map<String, dynamic> json) {
    return Store(
      id: json['id'],
      userId: json['user_id'],
      name: json['name'],
      address: json['address'],
      city: json['city'],
      state: json['state'],
      zipCode: json['zip_code'],
      country: json['country'],
      phone: json['phone'],
      email: json['email'],
      latitude: json['latitude'] != null
          ? double.parse(json['latitude'].toString())
          : null,
      longitude: json['longitude'] != null
          ? double.parse(json['longitude'].toString())
          : null,
      status: json['status'] ?? 'active',
      distanceKm: json['distance_km'] != null
          ? double.parse(json['distance_km'].toString())
          : null,
    );
  }
}
