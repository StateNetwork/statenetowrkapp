import type { RuleCategory, StoreItem, User } from '@/lib/types';

// This file is now mostly for reference, as data will be fetched from Firestore.
// You can delete it or keep it for seeding your database initially.

export const ruleCategories: RuleCategory[] = [
  {
    id: 'general',
    title: 'Normativa General',
    image: 'https://picsum.photos/600/400',
    imageHint: 'community guidelines',
    description: 'Reglas básicas de convivencia y comportamiento en el servidor.',
    content: `1. Respeto Mutuo: Trata a todos los jugadores con respeto. No se tolerará el acoso, el lenguaje ofensivo, el racismo, el sexismo ni ninguna forma de discriminación.\n\n2. No Griefing: Está prohibido destruir o modificar las construcciones de otros jugadores sin su permiso.\n\n3. No Cheating: El uso de hacks, exploits o cualquier tipo de trampa está estrictamente prohibido y resultará en un baneo permanente.\n\n4. Roleplay: Mantén el personaje en todo momento. Evita hablar fuera de personaje (OOC) en los canales de juego principales.`
  }
];


export const storeItems: StoreItem[] = [
  {
    id: 'item1',
    name: 'Paquete de Inicio "Aventurero"',
    price: 9.99,
    description: 'Un paquete esencial con herramientas de diamante, una armadura completa de hierro y 1000 monedas del juego.',
    terms: 'Este es un item de un solo uso por cuenta. No reembolsable. La entrega puede tardar hasta 15 minutos.',
    image: 'https://picsum.photos/400/300',
    imageHint: 'starter pack',
    type: 'paquete'
  },
];

export const users: User[] = [
  {
    id: 'user1',
    uid: 'user1',
    username: 'AdminUser',
    email: 'admin@mineserve.hq',
    avatar: 'https://picsum.photos/100/100',
    role: 'admin',
    packages: [storeItems[0]],
  },
  {
    id: 'user2',
    uid: 'user2',
    username: 'PlayerOne',
    email: 'player1@email.com',
    avatar: 'https://picsum.photos/100/100',
    role: 'user',
    packages: [],
  },
    {
    id: 'user3',
    uid: 'user3',
    username: 'asiman',
    email: 'asimandev@gmail.com',
    avatar: 'https://picsum.photos/100/100',
    role: 'admin',
    packages: [],
  },
];
