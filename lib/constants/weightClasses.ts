// lib/constants/weightClasses.ts
export const WEIGHT_CLASSES = {
  STRAWWEIGHT: {
    name: "Strawweight",
    limit: 115,
    gender: "WOMEN",
    order: 1
  },
  FLYWEIGHT: {
    name: "Flyweight",
    limit: 125,
    gender: "BOTH",
    order: 2
  },
  BANTAMWEIGHT: {
    name: "Bantamweight", 
    limit: 135,
    gender: "BOTH",
    order: 3
  },
  FEATHERWEIGHT: {
    name: "Featherweight",
    limit: 145,
    gender: "BOTH",
    order: 4
  },
  LIGHTWEIGHT: {
    name: "Lightweight",
    limit: 155,
    gender: "MEN",
    order: 5
  },
  WELTERWEIGHT: {
    name: "Welterweight",
    limit: 170,
    gender: "MEN",
    order: 6
  },
  MIDDLEWEIGHT: {
    name: "Middleweight",
    limit: 185,
    gender: "MEN",
    order: 7
  },
  LIGHT_HEAVYWEIGHT: {
    name: "Light Heavyweight",
    limit: 205,
    gender: "MEN",
    order: 8
  },
  HEAVYWEIGHT: {
    name: "Heavyweight",
    limit: 265,
    gender: "MEN",
    order: 9
  },
  SUPER_HEAVYWEIGHT: {
    name: "Super Heavyweight",
    limit: null, // No limit
    gender: "MEN",
    order: 10
  }
} as const;

export const MENS_DIVISIONS = [
  'FLYWEIGHT',
  'BANTAMWEIGHT',
  'FEATHERWEIGHT',
  'LIGHTWEIGHT',
  'WELTERWEIGHT',
  'MIDDLEWEIGHT',
  'LIGHT_HEAVYWEIGHT',
  'HEAVYWEIGHT'
];

export const WOMENS_DIVISIONS = [
  'STRAWWEIGHT',
  'FLYWEIGHT',
  'BANTAMWEIGHT',
  'FEATHERWEIGHT'
];

export const getWeightClassDisplay = (weightClass: string): string => {
  const wc = WEIGHT_CLASSES[weightClass as keyof typeof WEIGHT_CLASSES];
  if (!wc) return weightClass;
  
  if (wc.limit === null) {
    return `${wc.name} (265+ lbs)`;
  }
  return `${wc.name} (${wc.limit} lbs)`;
};

export const getWeightClassColor = (weightClass: string): string => {
  const colors: Record<string, string> = {
    STRAWWEIGHT: 'bg-pink-600',
    FLYWEIGHT: 'bg-purple-600',
    BANTAMWEIGHT: 'bg-indigo-600',
    FEATHERWEIGHT: 'bg-blue-600',
    LIGHTWEIGHT: 'bg-green-600',
    WELTERWEIGHT: 'bg-yellow-600',
    MIDDLEWEIGHT: 'bg-orange-600',
    LIGHT_HEAVYWEIGHT: 'bg-red-600',
    HEAVYWEIGHT: 'bg-gray-800',
    SUPER_HEAVYWEIGHT: 'bg-black'
  };
  
  return colors[weightClass] || 'bg-gray-600';
};