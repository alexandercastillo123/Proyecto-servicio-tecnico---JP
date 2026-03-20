class StoreProduct {
  final int id;
  final int sucursalId;
  final String name;
  final String? description;
  final double price;
  final String? imageUrl;
  final int? stock;
  final String? category;
  final String? brand;
  final String? sku;
  final bool isAvailable;
  final DateTime? createdAt;

  StoreProduct({
    required this.id,
    required this.sucursalId,
    required this.name,
    this.description,
    required this.price,
    this.imageUrl,
    this.stock,
    this.category,
    this.brand,
    this.sku,
    this.isAvailable = true,
    this.createdAt,
  });

  factory StoreProduct.fromJson(Map<String, dynamic> json) {
    return StoreProduct(
      id: json['id'],
      sucursalId: json['sucursal_id'] is int ? json['sucursal_id'] : int.parse(json['sucursal_id'].toString()),
      name: json['name'],
      description: json['description'],
      price: double.parse(json['price'].toString()),
      imageUrl: json['image_url'],
      stock: json['stock'],
      category: json['category'],
      brand: json['brand'],
      sku: json['sku'],
      isAvailable: json['is_available'] == 1 || json['is_available'] == true,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sucursal_id': sucursalId,
      'name': name,
      'description': description,
      'price': price,
      'image_url': imageUrl,
      'stock': stock,
      'category': category,
      'brand': brand,
      'sku': sku,
      'is_available': isAvailable,
    };
  }
}
