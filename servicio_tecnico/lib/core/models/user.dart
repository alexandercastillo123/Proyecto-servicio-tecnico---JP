class User {
  final int id;
  final String email;
  final String username;
  final String role;
  final String? phone;
  final String? profileImageUrl;
  final String? address;
  final String? city;
  final String? personType;
  final String? names;
  final String? surnames;
  final String? dni;
  final String? companyName;
  final String? ruc;
  final String? referenceAddress;
  final double? rating;
  final int? reviewsCount;
  bool isAvailable;

  User({
    required this.id,
    required this.email,
    required this.username,
    required this.role,
    this.phone,
    this.profileImageUrl,
    this.address,
    this.city,
    this.personType,
    this.names,
    this.surnames,
    this.dni,
    this.companyName,
    this.ruc,
    this.referenceAddress,
    this.rating,
    this.reviewsCount,
    this.isAvailable = true,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      role: json['role'] ?? '',
      phone: json['phone'],
      profileImageUrl: json['profile_image_url'],
      address: json['address'],
      city: json['city'],
      personType: json['person_type'],
      names: json['names'],
      surnames: json['surnames'],
      dni: json['dni'],
      companyName: json['company_name'],
      ruc: json['ruc'],
      referenceAddress: json['reference_address'],
      rating: json['rating'] != null ? double.parse(json['rating'].toString()) : null,
      reviewsCount: json['reviews_count'],
      isAvailable: json['is_available'] == 1 || json['is_available'] == true,
    );
  }
}
