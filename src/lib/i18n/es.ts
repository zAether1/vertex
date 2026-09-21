/**
 * Vertex — Diccionario de texto en español (Latinoamérica / Ecuador)
 *
 * TODAS las cadenas visibles al usuario están centralizadas aquí.
 * Los componentes importan desde este archivo.
 * Nombres de código interno se mantienen en inglés.
 */

/* ─── Navegación ────────────────────────────────────────── */

export const nav = {
  main: 'Principal',
  dashboard: 'Inicio',
  rewards: 'Recompensas',
  missions: 'Misiones',
  achievements: 'Logros',
  play: 'Jugar',
  arcade: 'Arcade',
  community: 'Comunidad',
  leaderboard: 'Clasificación',
  account: 'Cuenta',
  profile: 'Perfil',
  settings: 'Configuración',
  admin: 'Administración',
  logout: 'Cerrar sesión',
};

/* ─── Autenticación ─────────────────────────────────────── */

export const auth = {
  loginTitle: 'Bienvenido de nuevo',
  loginSubtitle: 'Inicia sesión en tu cuenta',
  registerTitle: 'Crea tu cuenta',
  registerSubtitle: 'Únete a la plataforma de recompensas',
  email: 'Correo electrónico',
  emailPlaceholder: 'tu@correo.com',
  password: 'Contraseña',
  passwordPlaceholder: '••••••••',
  passwordMinHint: 'Mínimo 8 caracteres',
  username: 'Nombre de usuario',
  usernamePlaceholder: 'Elige un nombre de usuario',
  signIn: 'Iniciar sesión',
  signUp: 'Crear cuenta',
  orContinueWith: 'o continuar con',
  continueWithGoogle: 'Continuar con Google',
  noAccount: '¿No tienes cuenta?',
  createAccount: 'Regístrate',
  hasAccount: '¿Ya tienes cuenta?',
  goToLogin: 'Inicia sesión',
  errors: {
    invalidCredentials: 'Correo o contraseña incorrectos',
    suspended: 'Tu cuenta ha sido suspendida. Contacta a un administrador.',
    genericAuth: 'Error de autenticación. Intenta de nuevo.',
    genericError: 'Ocurrió un error inesperado',
    registrationFailed: 'Error en el registro',
    emailExists: 'Ya existe una cuenta con este correo',
    usernameTaken: 'Este nombre de usuario ya está en uso',
  },
  registered: 'Cuenta creada exitosamente. Inicia sesión.',
};

/* ─── Panel / Dashboard ─────────────────────────────────── */

export const dashboard = {
  greeting: 'Bienvenido de nuevo',
  subtitle: 'Aquí tienes un resumen de tu actividad',
  balance: 'Saldo',
  totalEarned: 'Total ganado',
  totalSpent: 'Total gastado',
  received: 'Recibido',
  rewardsStore: 'Tienda',
  rewardsStoreDesc: 'Explora y canjea',
  missionsLabel: 'Misiones',
  missionsDesc: 'Completa desafíos',
  arcadeLabel: 'Arcade',
  arcadeDesc: 'Juega y gana',
  leaderboardLabel: 'Clasificación',
  leaderboardDesc: 'Ver ranking',
  recentActivity: 'Actividad reciente',
  viewAll: 'Ver todo',
  activeMissions: 'Misiones activas',
  noActivity: 'Sin actividad aún',
  noActivityDesc: 'Empieza a ganar puntos para ver tu actividad aquí',
  missionsLoading: 'Cargando misiones',
  missionsLoadingDesc: 'Completa misiones para ganar puntos extra',
  justNow: 'Ahora mismo',
  minutesAgo: (n: number) => `hace ${n} min`,
  hoursAgo: (n: number) => `hace ${n}h`,
  daysAgo: (n: number) => `hace ${n}d`,
};

/* ─── Tienda de Recompensas ─────────────────────────────── */

export const rewards = {
  title: 'Tienda de Recompensas',
  subtitle: 'Canjea tus puntos por recompensas exclusivas',
  searchPlaceholder: 'Buscar recompensas...',
  categories: {
    All: 'Todas',
    VIDEOGAMES: 'Videojuegos',
    GIFT_CARDS: 'Tarjetas de regalo',
    ACCOUNTS: 'Cuentas',
    PRODUCTS: 'Productos',
    PLATFORM_PERKS: 'Beneficios',
    SPECIAL: 'Especial',
    PHYSICAL: 'Físico',
    DIGITAL: 'Digital',
  } as Record<string, string>,
  limited: 'Limitado',
  soldOut: 'Agotado',
  left: (n: number) => `${n} disponibles`,
  confirmRedeem: 'Confirmar canje',
  processing: 'Procesando...',
  outOfStock: 'Agotado',
  cancel: 'Cancelar',
  pointsDeducted: 'puntos serán descontados',
  redeemed: '¡Canjeado!',
  rewardClaimed: 'Recompensa obtenida',
  rewardClaimedDesc: 'Tu recompensa ha sido canjeada exitosamente',
  noRewards: 'No hay recompensas disponibles',
  noRewardsDesc: 'Vuelve pronto para nuevas recompensas',
};

/* ─── Arcade ────────────────────────────────────────────── */

export const arcade = {
  title: 'Arcade',
  subtitle: 'Juega con tus puntos virtuales — sin dinero real',
  playNow: 'Jugar ahora',
  betAmount: 'Cantidad de apuesta (pts)',
  minBet: 'Mín',
  maxBet: 'Máx',
  payout: 'Pago',
  play: (n: number) => `Jugar por ${n} pts`,
  playing: 'Jugando...',
  youWon: '¡Ganaste!',
  youLost: 'Perdiste',
  playAgain: 'Jugar de nuevo',
  close: 'Cerrar',
  noGames: 'No hay juegos disponibles',
  noGamesDesc: 'Vuelve pronto',
  heads: 'Cara',
  tails: 'Cruz',
};

/* ─── Misiones ──────────────────────────────────────────── */

export const missions = {
  title: 'Misiones',
  subtitle: 'Completa objetivos para ganar puntos extra',
  progress: 'Progreso',
  completed: 'Completada',
  noMissions: 'No hay misiones activas',
  noMissionsDesc: 'Vuelve pronto para nuevas misiones',
};

/* ─── Logros ────────────────────────────────────────────── */

export const achievements = {
  title: 'Logros',
  subtitle: 'Desbloquea insignias al alcanzar hitos',
  rarities: {
    COMMON: 'Común',
    UNCOMMON: 'Poco común',
    RARE: 'Raro',
    EPIC: 'Épico',
    LEGENDARY: 'Legendario',
  } as Record<string, string>,
  locked: 'Bloqueado',
  unlocked: 'Desbloqueado',
  noAchievements: 'No hay logros disponibles',
};

/* ─── Clasificación ─────────────────────────────────────── */

export const leaderboard = {
  title: 'Clasificación',
  subtitle: 'Los mejores de esta temporada. Todas las identidades son anónimas.',
  position: 'Posición',
  pts: 'pts',
};

/* ─── Perfil ────────────────────────────────────────────── */

export const profile = {
  title: 'Configuración del perfil',
  subtitle: 'Administra tu alias público y los detalles de tu cuenta',
  publicIdentity: 'Identidad pública',
  displayAlias: 'Alias público (anónimo)',
  displayAliasHint: 'Esto es lo que ven los demás estudiantes en la clasificación.',
  bio: 'Biografía',
  saveChanges: 'Guardar cambios',
  accountDetails: 'Detalles de la cuenta',
  emailAddress: 'Correo electrónico',
  emailHint: 'El correo no puede cambiarse directamente. Contacta a un administrador.',
  changeAvatar: 'Cambiar avatar',
  signOut: 'Cerrar sesión',
};

/* ─── Landing ───────────────────────────────────────────── */

export const landing = {
  badge: 'Plataforma Privada',
  heroLine1: 'Tu actividad.',
  heroLine2: 'Tus',
  heroLine3: 'puntos',
  heroLine4: 'Tus recompensas.',
  heroDesc: 'Gana puntos virtuales a través de actividades, misiones y juegos. Canjéalos por recompensas exclusivas en la tienda.',
  getStarted: 'Comenzar',
  signIn: 'Iniciar sesión',
  featuresLabel: 'Características',
  featuresTitle: 'Todo lo que necesitas',
  features: [
    { title: 'Gana puntos', desc: 'Completa actividades, misiones y desafíos para ganar puntos virtuales en toda la plataforma.' },
    { title: 'Canjea recompensas', desc: 'Explora la tienda y cambia tus puntos por recompensas y premios exclusivos.' },
    { title: 'Completa misiones', desc: 'Sigue tu progreso en objetivos y desbloquea recompensas adicionales.' },
    { title: 'Juegos Arcade', desc: 'Juega con tus puntos virtuales en la sección de Arcade de forma recreativa.' },
    { title: 'Logros', desc: 'Desbloquea insignias cuando alcances hitos y construye tu colección.' },
    { title: 'Clasificación', desc: 'Compite en los rankings anónimos y mira cómo te posicionas.' },
  ],
  footer: 'Plataforma privada de recompensas',
};

/* ─── Validaciones (mensajes de error Zod) ──────────────── */

export const validation = {
  invalidEmail: 'Correo electrónico inválido',
  emailTooLong: 'El correo es demasiado largo',
  passwordMin: 'La contraseña debe tener al menos 8 caracteres',
  passwordMax: 'La contraseña es demasiado larga',
  passwordRequirements: 'La contraseña debe contener mayúsculas, minúsculas y un número',
  usernameMin: 'El nombre de usuario debe tener al menos 3 caracteres',
  usernameMax: 'El nombre de usuario es demasiado largo',
  usernameChars: 'El nombre de usuario solo puede contener letras, números y guiones bajos',
  aliasTooLong: 'El alias es demasiado largo',
  bioTooLong: 'La biografía es demasiado larga',
  invalidUrl: 'URL inválida',
  urlTooLong: 'La URL es demasiado larga',
  invalidUserId: 'ID de usuario inválido',
  amountMustBeWhole: 'La cantidad debe ser un número entero',
  amountCannotBeZero: 'La cantidad no puede ser cero',
  reasonRequired: 'El motivo es obligatorio',
  reasonTooLong: 'El motivo es demasiado largo',
  nameRequired: 'El nombre es obligatorio',
  nameTooLong: 'El nombre es demasiado largo',
  descTooLong: 'La descripción es demasiado larga',
  priceMustBePositive: 'El precio debe ser positivo',
  stockNegative: 'El stock no puede ser negativo',
  rewardNegative: 'La recompensa no puede ser negativa',
  targetMustBePositive: 'El objetivo debe ser positivo',
  betMustBePositive: 'La apuesta debe ser positiva',
  invalidRewardId: 'ID de recompensa inválido',
  invalidGameId: 'ID de juego inválido',
};

/* ─── General ───────────────────────────────────────────── */

export const general = {
  loading: 'Cargando...',
  error: 'Error',
  success: 'Éxito',
  save: 'Guardar',
  cancel: 'Cancelar',
  delete: 'Eliminar',
  edit: 'Editar',
  create: 'Crear',
  search: 'Buscar',
  filter: 'Filtrar',
  noResults: 'Sin resultados',
  pts: 'pts',
  points: 'puntos',
  tooManyRequests: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
  unauthorized: 'No autorizado',
  forbidden: 'Acceso denegado',
  serverError: 'Error del servidor',
  validationFailed: 'Error de validación',
};

/* ─── Metadatos de páginas ──────────────────────────────── */

export const meta = {
  home: 'Vertex — Plataforma de Recompensas',
  homeDesc: 'Gana puntos, completa misiones y desbloquea recompensas.',
  login: 'Iniciar sesión — Vertex',
  register: 'Crear cuenta — Vertex',
  dashboard: 'Inicio — Vertex',
  rewards: 'Recompensas — Vertex',
  arcade: 'Arcade — Vertex',
  missions: 'Misiones — Vertex',
  achievements: 'Logros — Vertex',
  leaderboard: 'Clasificación — Vertex',
  profile: 'Perfil — Vertex',
  settings: 'Configuración — Vertex',
};
