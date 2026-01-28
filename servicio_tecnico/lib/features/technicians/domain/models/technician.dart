class Technician {
  final String id;
  final String name;
  final String dniRuc;
  final String location;
  final double rating;
  final int reviewsCount;
  final String profileImageUrl;

  Technician({
    required this.id,
    required this.name,
    required this.dniRuc,
    required this.location,
    required this.rating,
    required this.reviewsCount,
    this.profileImageUrl = '',
  });

  factory Technician.fromJson(Map<String, dynamic> json) {
    // Determinar el nombre según persona natural o jurídica
    String name = '';
    if (json['person_type'] == 'natural') {
      name = '${json['names'] ?? ''} ${json['surnames'] ?? ''}'.trim();
    } else {
      name = json['company_name'] ?? '';
    }

    // Determinar DNI/RUC
    String dniRuc = json['dni'] ?? json['ruc'] ?? '';

    return Technician(
      id: json['id'].toString(),
      name: name,
      dniRuc: dniRuc,
      location: json['reference_address'] ?? json['address'] ?? '',
      rating: (json['rating'] ?? 0.0).toDouble(),
      reviewsCount: json['reviews_count'] ?? 0,
      profileImageUrl: json['profile_image_url'] ?? '',
    );
  }
}

final List<Technician> mockTechnicians = [
  Technician(
    id: '1',
    name: 'Juan Pérez',
    dniRuc: '10724589631',
    location: 'Av. Larco 123, Miraflores',
    rating: 4.8,
    reviewsCount: 124,
  ),
  Technician(
    id: '2',
    name: 'Carlos Rodríguez',
    dniRuc: '20556677881',
    location: 'Calle Lima 456, San Isidro',
    rating: 4.5,
    reviewsCount: 89,
  ),
  Technician(
    id: '3',
    name: 'María García',
    dniRuc: '10998877661',
    location: 'Av. Javier Prado 789, San Borja',
    rating: 4.9,
    reviewsCount: 156,
  ),
];
