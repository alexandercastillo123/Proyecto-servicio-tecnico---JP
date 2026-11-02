import { ServiceDetail, DistrictCoverage, DeviceType } from '../types';

export const JYP_SERVICES: ServiceDetail[] = [
  {
    id: 'soporte-ti',
    code: '2.1',
    title: 'Soporte de TI y Help Desk',
    subtitle: 'Mantenimiento preventivo y correctivo',
    tagline: 'Soporte confiable, ágil y garantizado',
    category: 'software',
    icon: 'Cpu',
    description: 'Atención especializada para hogares y empresas. Solucionamos problemas de lentitud, bloqueos del sistema, virus, instalación de software con licencias originales y optimización integral de equipos.',
    features: [
      'Mantenimiento preventivo y correctivo de hardware/software',
      'Atención Help Desk remota o presencial a domicilio',
      'Formateo con respaldo de archivos e instalación de drivers',
      'Configuración de correos corporativos y accesos seguros'
    ],
    commonProblems: [
      'Equipo extremadamente lento al encender',
      'Pantallazos azules o congelamiento continuo',
      'Infección por virus, troyanos o pop-ups molestos',
      'Programas de oficina bloqueados o desactualizados'
    ],
    estimatedTime: '1 a 2 horas',
    startingPrice: 65,
    popular: true
  },
  {
    id: 'hardware',
    code: '2.2',
    title: 'Ingeniería de Hardware & Reparación',
    subtitle: 'Diagnóstico a nivel de componentes',
    tagline: 'Ingeniería de precisión para tus equipos',
    category: 'hardware',
    icon: 'Wrench',
    description: 'Reparación avanzada de laptops, computadoras de escritorio y servidores. Diagnóstico electrónico de placas madre, cambio de pantallas, teclados, bisagras y reemplazo por repuestos originales garantizados.',
    features: [
      'Reparación de placas madre y circuitos de carga',
      'Cambio de pantallas LED/IPS, flex y teclados retroiluminados',
      'Upgrade a memorias RAM de alta velocidad y discos SSD NVMe',
      'Reconstrucción de bisagras y carcasas dañadas'
    ],
    commonProblems: [
      'La laptop no enciende o no pasa energía',
      'Pantalla quebrada, con rayas o sin brillo',
      'Teclado con teclas pegadas o que no responden',
      'Sobrecalentamiento y ventilador ruidoso'
    ],
    estimatedTime: '1 a 3 horas (en domicilio) o 24h (taller)',
    startingPrice: 80,
    popular: true
  },
  {
    id: 'redes',
    code: '2.3',
    title: 'Redes y Comunicaciones',
    subtitle: 'Conectividad estable y segura',
    tagline: 'Dándote las mejores soluciones de conexión',
    category: 'network',
    icon: 'Wifi',
    description: 'Diseño, configuración y optimización de redes cableadas e inalámbricas. Eliminamos puntos ciegos de Wi-Fi en casas y departamentos mediante sistemas Mesh y configuramos switches empresariales y routers.',
    features: [
      'Implementación de sistemas Wi-Fi 6 Mesh sin cortes',
      'Cableado estructurado Cat 6 y 6A para oficinas y casas',
      'Configuración de switches administrables y VPNs seguras',
      'Certificación y diagnóstico de pérdida de paquetes'
    ],
    commonProblems: [
      'La señal de Wi-Fi no llega a habitaciones o pisos superiores',
      'Cortes intermitentes durante videollamadas o reuniones Zoom',
      'Velocidad contratada no se refleja en los dispositivos',
      'Impresoras o servidores de archivos que se desconectan de la red'
    ],
    estimatedTime: '2 a 4 horas',
    startingPrice: 90
  },
  {
    id: 'recuperacion-datos',
    code: '2.4',
    title: 'Recuperación de Datos Críticos',
    subtitle: 'Restauración en discos HDD, SSD y memorias',
    tagline: 'Salvando tus fotos, documentos y bases de datos',
    category: 'hardware',
    icon: 'HardDrive',
    description: 'Laboratorio especializado en rescate de archivos ante fallos mecánicos de disco, formateo accidental, corrupción de particiones o ataques de ransomware. Confidencialidad y seguridad certificada.',
    features: [
      'Recuperación desde discos duros externos, internos HDD y SSD',
      'Extracción en servidores RAID y sistemas NAS',
      'Rescate de fotos familiares, tesis y contabilidad empresarial',
      'Garantía de confidencialidad absoluta mediante acuerdo NDA'
    ],
    commonProblems: [
      'El disco emite ruidos extraños (clics metálicos)',
      'La laptop pide formatear la unidad al conectarla',
      'Archivos borrados accidentalmente de la papelera',
      'La memoria USB no es reconocida por el sistema'
    ],
    estimatedTime: '24 a 48 horas (evaluación previa)',
    startingPrice: 120
  },
  {
    id: 'seguridad-electronica',
    code: '2.5',
    title: 'Seguridad Electrónica & CCTV',
    subtitle: 'Cámaras de videovigilancia y control biométrico',
    tagline: 'Protegemos tu espacio y patrimonio',
    category: 'security',
    icon: 'ShieldCheck',
    description: 'Instalación y mantenimiento de sistemas de videovigilancia en alta definición (IP y HD-TVI) y control de acceso. Monitorea tu casa, local comercial o empresa en tiempo real desde tu teléfono Android o navegador web.',
    features: [
      'Cámaras de seguridad Full HD y 4K con visión nocturna a color',
      'Configuración de acceso remoto seguro en teléfonos móviles',
      'Sistemas de grabación NVR / DVR con almacenamiento redundante',
      'Control de acceso biométrico y tarjetas de proximidad'
    ],
    commonProblems: [
      'Las cámaras no se ven en el celular fuera de la red local',
      'Grabador DVR emite pitidos de alerta de disco',
      'Cámaras con imagen borrosa o fallas de alimentación',
      'Necesidad de instalar nuevas cámaras de protección'
    ],
    estimatedTime: '2 a 5 horas según puntos',
    startingPrice: 95
  },
  {
    id: 'ciberseguridad',
    code: '2.6',
    title: 'Gestión de Ciberseguridad & Licenciamiento',
    subtitle: 'Blindaje contra malware y análisis de riesgos',
    tagline: 'Cuidando tu seguridad digital en todo momento',
    category: 'security',
    icon: 'Lock',
    description: 'Protegemos la integridad de tu información y sistemas contra amenazas digitales. Detección de vulnerabilidades, erradicación profunda de malware y licenciamiento genuino de Microsoft y antivirus.',
    features: [
      'Análisis de vulnerabilidades y blindaje de endpoints',
      'Eliminación de virus, spyware y troyanos ocultos',
      'Licencias oficiales de Windows, Microsoft 365 y Suites Antivirus',
      'Políticas de copias de seguridad automáticas en la nube'
    ],
    commonProblems: [
      'Sospecha de robo de contraseñas o hackeo de cuentas',
      'Alerta de software no original o licencia vencida',
      'Archivos encriptados o con extensiones extrañas',
      'Equipos vulnerables que manejan información bancaria sensible'
    ],
    estimatedTime: '1 a 3 horas',
    startingPrice: 75
  },
  {
    id: 'impresoras',
    code: '2.7',
    title: 'Reparación y Mantenimiento de Impresoras',
    subtitle: 'Láser, inyección y sistemas continuos',
    tagline: 'Soluciones que imprimen sin interrupciones',
    category: 'hardware',
    icon: 'Printer',
    description: 'Servicio técnico especializado para impresoras de hogar y oficinas. Diagnóstico de atascos, cambio de almohadillas, calibración y desobstrucción de cabezales, recarga y mantenimiento preventivo general.',
    features: [
      'Atención a marcas Epson, HP, Canon, Brother y Samsung',
      'Desbloqueo de almohadillas y reinicio de contador interno',
      'Mantenimiento de sistemas de tinta continua y láser',
      'Limpieza técnica profunda de rodillos y engranajes'
    ],
    commonProblems: [
      'Atascos de papel constantes o no jala las hojas',
      'Impresiones con rayas horizontales o colores apagados',
      'Luces de error parpadeando (almohadillas de tinta llenas)',
      'Impresora no se conecta al Wi-Fi o aparece sin conexión'
    ],
    estimatedTime: '1 a 2 horas',
    startingPrice: 60,
    popular: true
  },
  {
    id: 'proyectos',
    code: '2.8',
    title: 'Equipamiento & Proyectos Corporativos',
    subtitle: 'Venta de equipos, servidores e infraestructura',
    tagline: 'Tu aliado tecnológico con más de 20 años de experiencia',
    category: 'enterprise',
    icon: 'Server',
    description: 'Asesoría y suministro de soluciones informáticas llave en mano. Computadoras para empresas, servidores rack, gabinetes, periféricos y equipamiento para puestos de trabajo home office y corporativos.',
    features: [
      'Venta de laptops y PCs ensambladas con componentes de marca',
      'Servidores para bases de datos y almacenamiento compartido',
      'Gabinete para data centers y sistemas de energía ininterrumpida UPS',
      'Facturación electrónica oficial y asesoría técnica B2B'
    ],
    commonProblems: [
      'Necesidad de renovar parque informático con garantía',
      'Implementación de servidor de archivos interno',
      'Adquisición de lotes de accesorios y periféricos originales',
      'Diseño de infraestructura para nueva oficina o sede'
    ],
    estimatedTime: 'A medida según alcance',
    startingPrice: 150
  }
];

export const DEVICE_OPTIONS: { id: DeviceType; name: string; icon: string; description: string }[] = [
  { id: 'laptop', name: 'Laptop / Notebook', icon: 'Laptop', description: 'HP, Lenovo, Dell, Asus, Acer' },
  { id: 'desktop', name: 'PC de Escritorio / Gamer', icon: 'Monitor', description: 'Torres, mini PCs, Workstations' },
  { id: 'mac', name: 'MacBook / iMac', icon: 'Apple', description: 'Apple M1/M2/M3 e Intel' },
  { id: 'printer', name: 'Impresora / Multifuncional', icon: 'Printer', description: 'Epson, HP, Canon, Brother' },
  { id: 'network', name: 'Red Wi-Fi / Router / Mesh', icon: 'Wifi', description: 'Cortes de señal y cableado' },
  { id: 'cctv', name: 'Cámaras de Seguridad CCTV', icon: 'Camera', description: 'Sistemas DVR, NVR e IP' },
  { id: 'data_recovery', name: 'Disco Duro / Recuperación', icon: 'HardDrive', description: 'HDD, SSD, Memorias USB' }
];

export const COMMON_PROBLEMS_BY_DEVICE: Record<DeviceType, { key: string; label: string; min: number; max: number; time: string }[]> = {
  laptop: [
    { key: 'mantenimiento', label: 'Mantenimiento preventivo, pasta térmica y limpieza', min: 70, max: 95, time: '1 - 2 hrs' },
    { key: 'no_enciende', label: 'No enciende o no carga la batería', min: 90, max: 150, time: '2 - 3 hrs' },
    { key: 'lenta_virus', label: 'Extremadamente lenta, virus o pop-ups', min: 65, max: 90, time: '1 - 2 hrs' },
    { key: 'pantalla_rota', label: 'Pantalla rota, con líneas o parpadeo', min: 140, max: 280, time: '24 hrs (taller/domicilio)' },
    { key: 'teclado_fallas', label: 'Teclas no responden o derrame de líquido', min: 80, max: 130, time: '1 - 2 hrs' },
    { key: 'upgrade_ssd', label: 'Cambio de disco a SSD NVMe de alta velocidad', min: 120, max: 220, time: '1 - 2 hrs' }
  ],
  desktop: [
    { key: 'mantenimiento', label: 'Limpieza profunda de polvo y pasta térmica', min: 65, max: 90, time: '1 - 2 hrs' },
    { key: 'no_enciende', label: 'No enciende o fuente de poder averiada', min: 80, max: 140, time: '1 - 2 hrs' },
    { key: 'pantalla_azul', label: 'Pantallazos azules (BSOD) o reinicios', min: 70, max: 100, time: '1 - 2 hrs' },
    { key: 'upgrade_hardware', label: 'Repotenciación (RAM, Tarjeta de video, SSD)', min: 90, max: 180, time: '1 - 2 hrs' },
    { key: 'formateo', label: 'Formateo, instalación Windows 11 y programas', min: 65, max: 85, time: '1 - 2 hrs' }
  ],
  mac: [
    { key: 'mantenimiento_mac', label: 'Mantenimiento térmico y optimización macOS', min: 110, max: 160, time: '2 hrs' },
    { key: 'bateria_mac', label: 'Reemplazo de batería certificada', min: 220, max: 380, time: '24 hrs' },
    { key: 'sistema_mac', label: 'Reinstalación limpia de macOS y backup', min: 90, max: 130, time: '2 hrs' },
    { key: 'pantalla_teclado', label: 'Reparación de teclado mariposa / pantalla Retina', min: 250, max: 550, time: '24 - 48 hrs' }
  ],
  printer: [
    { key: 'atasco_papel', label: 'Atasco frecuente de papel o rodillos gastados', min: 60, max: 90, time: '1 - 2 hrs' },
    { key: 'cabezal_tapado', label: 'Cabezal tapado o impresión con rayas', min: 65, max: 100, time: '1 - 2 hrs' },
    { key: 'almohadillas', label: 'Almohadillas llenas (reset de contador)', min: 55, max: 80, time: '45 min' },
    { key: 'instalacion_red', label: 'Configuración Wi-Fi e instalación en PCs', min: 50, max: 75, time: '1 hr' }
  ],
  network: [
    { key: 'wifi_ampliacion', label: 'Instalación de sistema Wi-Fi Mesh sin zonas muertas', min: 110, max: 180, time: '2 - 3 hrs' },
    { key: 'cableado', label: 'Punto de red cableado Cat6 a habitación u oficina', min: 85, max: 140, time: '2 - 3 hrs' },
    { key: 'cortes_conexion', label: 'Diagnóstico de lentitud y configuración de router', min: 70, max: 95, time: '1 - 2 hrs' }
  ],
  cctv: [
    { key: 'mantenimiento_cctv', label: 'Revisión general de cámaras y grabador DVR/NVR', min: 90, max: 140, time: '2 - 3 hrs' },
    { key: 'acceso_remoto', label: 'Configuración para ver cámaras en celular', min: 75, max: 110, time: '1 - 2 hrs' },
    { key: 'nueva_instalacion', label: 'Instalación de kit de cámaras Full HD', min: 200, max: 450, time: '3 - 6 hrs' }
  ],
  data_recovery: [
    { key: 'disco_no_reconoce', label: 'Disco no es detectado o pide formatear', min: 130, max: 280, time: '24 - 48 hrs' },
    { key: 'borrado_accidental', label: 'Archivos o fotos eliminados recientemente', min: 100, max: 190, time: '12 - 24 hrs' },
    { key: 'dano_mecanico', label: 'Disco con ruidos o golpes físicos (laboratorio)', min: 250, max: 600, time: '48 - 72 hrs' }
  ]
};

export const DISTRICTS_COVERAGE: DistrictCoverage[] = [
  { name: 'Miraflores', zone: 'Lima Centro-Sur', eta: '30 - 45 min', deliveryFee: 0, availableToday: true },
  { name: 'San Isidro', zone: 'Lima Centro-Sur', eta: '30 - 45 min', deliveryFee: 0, availableToday: true },
  { name: 'Santiago de Surco', zone: 'Lima Sur', eta: '35 - 50 min', deliveryFee: 0, availableToday: true },
  { name: 'San Borja', zone: 'Lima Centro-Sur', eta: '30 - 45 min', deliveryFee: 0, availableToday: true },
  { name: 'Jesús María', zone: 'Lima Centro', eta: '25 - 40 min', deliveryFee: 0, availableToday: true },
  { name: 'Lince', zone: 'Lima Centro', eta: '25 - 40 min', deliveryFee: 0, availableToday: true },
  { name: 'Magdalena del Mar', zone: 'Lima Oeste', eta: '30 - 45 min', deliveryFee: 0, availableToday: true },
  { name: 'San Miguel', zone: 'Lima Oeste', eta: '30 - 45 min', deliveryFee: 0, availableToday: true },
  { name: 'Pueblo Libre', zone: 'Lima Centro-Oeste', eta: '25 - 40 min', deliveryFee: 0, availableToday: true },
  { name: 'Barranco', zone: 'Lima Sur', eta: '35 - 50 min', deliveryFee: 0, availableToday: true },
  { name: 'La Molina', zone: 'Lima Este', eta: '45 - 60 min', deliveryFee: 10, availableToday: true },
  { name: 'Cercado de Lima', zone: 'Lima Centro', eta: '20 - 35 min', deliveryFee: 0, availableToday: true },
  { name: 'Breña', zone: 'Lima Centro', eta: '20 - 35 min', deliveryFee: 0, availableToday: true },
  { name: 'Surquillo', zone: 'Lima Centro-Sur', eta: '30 - 45 min', deliveryFee: 0, availableToday: true },
  { name: 'Chorrillos', zone: 'Lima Sur', eta: '40 - 55 min', deliveryFee: 10, availableToday: true },
  { name: 'Los Olivos', zone: 'Lima Norte', eta: '45 - 60 min', deliveryFee: 15, availableToday: true },
  { name: 'San Martín de Porres', zone: 'Lima Norte', eta: '45 - 60 min', deliveryFee: 15, availableToday: true },
  { name: 'Ate / Mayorazgo', zone: 'Lima Este', eta: '45 - 60 min', deliveryFee: 15, availableToday: true },
  { name: 'Callao (Bellavista/La Perla)', zone: 'Callao', eta: '35 - 50 min', deliveryFee: 10, availableToday: true }
];

export const TRUST_METRICS = [
  { value: '+20', label: 'Años de Experiencia', sub: 'Desde el corazón de Lima' },
  { value: '+15k', label: 'Servicios Completados', sub: 'Hogares y empresas en Lima' },
  { value: '85%', label: 'Resueltos en Visita', sub: 'Solución directa en tu casa' },
  { value: '90 Días', label: 'Garantía por Escrito', sub: 'Boleta o factura legal' }
];

export const TESTIMONIALS = [
  {
    name: 'Ing. Rodrigo Mendoza',
    role: 'Gerente de Operaciones · Consultora RM',
    location: 'San Isidro, Lima',
    service: 'Soporte TI y Red Wi-Fi Mesh',
    text: 'Teníamos caídas constantes de red durante presentaciones con clientes en nuestra oficina. Solicitamos el servicio desde la plataforma web y en 40 minutos llegó el especialista con sus herramientas. Solucionó el enrutamiento y configuró la red Mesh. Impecable servicio.',
    rating: 5,
    date: 'Hace 2 semanas'
  },
  {
    name: 'Dra. Carmen Valdivia',
    role: 'Médico Neumóloga · Telemedicina',
    location: 'Miraflores, Lima',
    service: 'Reparación de Laptop y Upgrade SSD',
    text: 'Mi laptop de trabajo no iniciaba y tenía pacientes agendados. Descargué la app en mi teléfono Android, pedí la visita de emergencia y el técnico llegó puntual, identificado con carnet de J&P. Hizo el diagnóstico delante mío, cambió el disco y recuperó todos mis historiales.',
    rating: 5,
    date: 'Hace 3 semanas'
  },
  {
    name: 'Martín Barrenechea',
    role: 'Diseñador Gráfico & Productor Audiovisual',
    location: 'San Borja, Lima',
    service: 'Recuperación de Datos en Disco Externo',
    text: 'Mi disco de 4TB con renders de un cliente dejó de leer. Me atendieron con suma transparencia, me llevaron al laboratorio de Galería Centro de Lima y salvaron el 100% de los proyectos. Empresa peruana seria con más de 20 años de verdad.',
    rating: 5,
    date: 'El mes pasado'
  }
];

export const FAQS = [
  {
    q: '¿Cómo solicito un técnico a domicilio desde la Web o Android?',
    a: 'Puedes solicitarlo de dos formas muy sencillas: descargando nuestra aplicación móvil para Android (formato APK oficial o enlace) o utilizando directamente el formulario web en esta misma página. Solo eliges tu equipo, tu dirección en Lima y el horario que mejor te convenga.'
  },
  {
    q: '¿Cómo garantizan la seguridad y confianza al entrar a mi hogar u oficina?',
    a: 'La seguridad de nuestros clientes es nuestra prioridad absoluta. Todos los técnicos de J&P Periféricos S.A.C. cuentan con antecedentes policiales, judiciales y penales verificados, visten uniforme corporativo, portan carnet oficial con código QR de verificación y su identidad aparece confirmada en tu app antes de su llegada.'
  },
  {
    q: '¿Qué sucede si mi equipo no se puede reparar en mi casa?',
    a: 'Más del 85% de las incidencias (mantenimiento, formateo, cambio de pantalla, teclado, software o repotenciación) se resuelven en el mismo domicilio frente a ti. Si la falla requiere laboratorio de microsoldadura o cámara limpia (como fallas complejas de placa o discos mecánicos), el técnico emite una Guía de Recepción Foliada con firma digital para su traslado a nuestra sede central en Av. Bolivia 148, Oficina 2218, Centro de Lima.'
  },
  {
    q: '¿Qué garantía tienen los servicios y repuestos?',
    a: 'Todos los servicios técnicos de J&P cuentan con una garantía escrita de entre 30 y 90 días calendario según el tipo de intervención. Los repuestos nuevos cuentan además con la garantía directa del fabricante. Entregamos boleta o factura electrónica oficial.'
  },
  {
    q: '¿Qué métodos de pago aceptan una vez terminado el trabajo?',
    a: 'Aceptamos pagos digitales inmediatos a través de Yape, Plin, transferencias bancarias directas (BCP, BBVA, Interbank, Scotiabank), tarjetas de crédito/débito y efectivo contra entrega de conformidad de servicio.'
  },
  {
    q: '¿En qué se diferencia la App de Android del acceso Web?',
    a: 'La App móvil Android te permite recibir alertas en tiempo real, ver la ubicación aproximada del técnico en camino por GPS y guardar tus equipos favoritos. El portal Web es ideal si estás trabajando en tu laptop o PC y no necesitas instalar nada adicional, permitiéndote agendar con la misma rapidez y consultar comprobantes fiscales.'
  }
];
