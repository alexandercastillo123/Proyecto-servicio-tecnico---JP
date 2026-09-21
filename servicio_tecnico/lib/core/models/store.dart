class Store {
  final int id;
  final int userId;
  final String name;
  final String? description;
  final String address;
  final String city;
  final String state;
  final String zipCode;
  final String country;
  final String phone;
  final String email;
  final String? whatsapp;
  final String? websiteUrl;
  final String? imageUrl;
  final double? latitude;
  final double? longitude;
  final double rating;
  final int reviewsCount;
  final String? specialties;
  final Map<String, dynamic>? socialMedia;
  final String? openingTime;
  final String? closingTime;
  final String? openDays;
  final String status;
  final double? distanceKm;

  Store({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    required this.address,
    required this.city,
    required this.state,
    required this.zipCode,
    required this.country,
    required this.phone,
    required this.email,
    this.whatsapp,
    this.websiteUrl,
    this.imageUrl,
    this.latitude,
    this.longitude,
    this.rating = 0,
    this.reviewsCount = 0,
    this.specialties,
    this.socialMedia,
    this.openingTime,
    this.closingTime,
    this.openDays,
    required this.status,
    this.distanceKm,
  });

  factory Store.fromJson(Map<String, dynamic> json) {
    return Store(
      id: json['id'],
      userId: json['user_id'],
      name: json['name'],
      description: json['description'],
      address: json['address'],
      city: json['city'],
      state: json['state'],
      zipCode: json['zip_code'],
      country: json['country'],
      phone: json['phone'],
      email: json['email'],
      whatsapp: json['whatsapp'],
      websiteUrl: json['website_url'],
      imageUrl: json['image_url'],
      latitude: json['latitude'] != null
          ? double.tryParse(json['latitude'].toString())
          : null,
      longitude: json['longitude'] != null
          ? double.tryParse(json['longitude'].toString())
          : null,
      rating: double.tryParse((json['rating'] ?? 0).toString()) ?? 0,
      reviewsCount: json['reviews_count'] ?? 0,
      specialties: json['specialties'],
      socialMedia: json['social_media'] is Map ? json['social_media'] : null,
      openingTime: json['opening_time'],
      closingTime: json['closing_time'],
      openDays: json['open_days'],
      status: json['status'] ?? 'active',
      distanceKm: json['distance_km'] != null
          ? double.tryParse(json['distance_km'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'address': address,
      'city': city,
      'state': state,
      'zip_code': zipCode,
      'country': country,
      'phone': phone,
      'email': email,
      'whatsapp': whatsapp,
      'website_url': websiteUrl,
      'latitude': latitude,
      'longitude': longitude,
      'specialties': specialties,
      'opening_time': openingTime,
      'closing_time': closingTime,
      'open_days': openDays,
      'status': status,
    };
  }
}
