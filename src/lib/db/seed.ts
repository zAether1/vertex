import { db } from './index';
import { games, missions, achievements, rewards } from './schema';

async function seed() {
  console.log('🌱 Iniciando seeding de base de datos...');

  console.log('🎮 Insertando catálogo de juegos Arcade...');
  await db.insert(games).values([
    {
      id: '78b47e24-42b7-4c0d-b4ef-1b2c6e6d1f5e',
      name: 'Lanzamiento de Moneda',
      description: 'Doble o nada. Elige Cara o Cruz.',
      type: 'COIN_FLIP',
      status: 'ACTIVE',
      minBet: 10,
      maxBet: 500,
      houseEdge: 500,
      payoutMultiplier: 200,
      maxPlaysPerHour: 100,
      maxPlaysPerDay: 500,
    },
    {
      id: '89c47e24-42b7-4c0d-b4ef-1b2c6e6d1f5f',
      name: 'Dados Suerte',
      description: 'Lanza los dados y acierta.',
      type: 'DICE',
      status: 'ACTIVE',
      minBet: 50,
      maxBet: 1000,
      houseEdge: 500,
      payoutMultiplier: 150,
      maxPlaysPerHour: 50,
      maxPlaysPerDay: 200,
    }
  ]).onConflictDoNothing({ target: games.id });

  console.log('🎯 Insertando estructura de misiones...');
  await db.insert(missions).values([
    {
      id: '11c47e24-42b7-4c0d-b4ef-1b2c6e6d1f5a',
      name: 'Bienvenido a Vertex',
      description: 'Completa tu primer inicio de sesión en la plataforma.',
      reward: 100,
      targetValue: 1,
      targetType: 'ONE_TIME',
      status: 'ACTIVE',
    }
  ]).onConflictDoNothing({ target: missions.id });

  console.log('🏆 Insertando estructura de logros...');
  await db.insert(achievements).values([
    {
      id: '22c47e24-42b7-4c0d-b4ef-1b2c6e6d1f5b',
      name: 'Primeros Pasos',
      description: 'Has entrado a Vertex por primera vez.',
      category: 'GENERAL',
      triggerType: 'first_login',
      isHidden: false,
    }
  ]).onConflictDoNothing({ target: achievements.id });

  console.log('🎁 Insertando estructura de recompensas...');
  await db.insert(rewards).values([
    {
      id: '33c47e24-42b7-4c0d-b4ef-1b2c6e6d1f5c',
      name: 'Pase Exclusivo (Plantilla)',
      description: 'Beneficio exclusivo dentro de la plataforma.',
      price: 5000,
      stock: 10,
      category: 'PLATFORM_PERKS',
      status: 'ACTIVE',
      hasPrivatePayload: false,
      requiresApproval: true,
      maxPerUser: 1,
    }
  ]).onConflictDoNothing({ target: rewards.id });

  console.log('✅ Seeding completado exitosamente.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error durante el seeding:', err);
  process.exit(1);
});


