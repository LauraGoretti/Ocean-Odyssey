import { OceanCurrent } from '../types';

// Simplified paths for visualization
export const OCEAN_CURRENTS: OceanCurrent[] = [
  {
    id: 'gulf_stream',
    name: 'Gulf Stream',
    description: 'A warm and swift Atlantic ocean current that originates in the Gulf of Mexico.',
    startLocation: 'Florida, USA',
    endLocation: 'London, UK',
    color: '#FF6B6B', // Red/Warm
    avgTemp: '25°C',
    avgSpeed: '2.5 m/s',
    path: [
      { lat: 25.0, lng: -80.0 }, // Florida
      { lat: 30.0, lng: -75.0 },
      { lat: 35.0, lng: -70.0 },
      { lat: 40.0, lng: -60.0 },
      { lat: 45.0, lng: -45.0 },
      { lat: 50.0, lng: -30.0 },
      { lat: 51.0, lng: -10.0 }, // Towards UK
      { lat: 51.5, lng: 0.0 }   // London
    ],
    biodiversity: [
      { name: 'Bluefin Tuna', emoji: '🐟', depth: 'Surface' },
      { name: 'Loggerhead Turtle', emoji: '🐢', depth: '20m' },
      { name: 'Flying Fish', emoji: '🐠', depth: 'Surface' }
    ]
  },
  {
    id: 'kuroshio',
    name: 'Kuroshio Current',
    description: 'Also known as the Black Stream, flowing north-eastward past Japan.',
    startLocation: 'Philippines',
    endLocation: 'Tokyo, Japan',
    color: '#4ECDC4', // Teal
    avgTemp: '24°C',
    avgSpeed: '1.5 m/s',
    path: [
      { lat: 14.0, lng: 121.0 }, // Philippines
      { lat: 20.0, lng: 125.0 },
      { lat: 25.0, lng: 128.0 },
      { lat: 30.0, lng: 135.0 },
      { lat: 35.0, lng: 140.0 }  // Japan
    ],
    biodiversity: [
      { name: 'Coral Reefs', emoji: '🪸', depth: '10m' },
      { name: 'Whale Shark', emoji: '🦈', depth: '50m' },
      { name: 'Squid', emoji: '🦑', depth: '200m' }
    ]
  },
  {
    id: 'humboldt',
    name: 'Humboldt Current',
    description: 'A cold, low-salinity ocean current that flows north along the western coast of South America.',
    startLocation: 'Antarctica',
    endLocation: 'Galapagos Islands',
    color: '#45B7D1', // Cold Blue
    avgTemp: '12°C',
    avgSpeed: '0.8 m/s',
    path: [
      { lat: -60.0, lng: -70.0 }, // Near Antarctica
      { lat: -45.0, lng: -75.0 }, // Chile
      { lat: -30.0, lng: -78.0 },
      { lat: -15.0, lng: -80.0 }, // Peru
      { lat: -0.9, lng: -90.0 }   // Galapagos
    ],
    biodiversity: [
      { name: 'Penguin', emoji: '🐧', depth: 'Surface' },
      { name: 'Anchovy', emoji: '🐟', depth: '30m' },
      { name: 'Giant Squid', emoji: '🦑', depth: '600m' }
    ]
  },
  {
    id: 'eac',
    name: 'East Australian Current',
    description: 'The playground of sea turtles! Flows southward along the east coast of Australia.',
    startLocation: 'Great Barrier Reef',
    endLocation: 'Sydney, Australia',
    color: '#FFE66D', // Yellow/Sunny
    avgTemp: '22°C',
    avgSpeed: '2.0 m/s',
    path: [
      { lat: -15.0, lng: 145.0 }, // Barrier Reef
      { lat: -20.0, lng: 150.0 },
      { lat: -25.0, lng: 153.0 },
      { lat: -30.0, lng: 155.0 },
      { lat: -34.0, lng: 151.0 }  // Sydney
    ],
    biodiversity: [
      { name: 'Clownfish', emoji: '🐠', depth: '10m' },
      { name: 'Sea Turtle', emoji: '🐢', depth: '30m' },
      { name: 'Great White Shark', emoji: '🦈', depth: '100m' }
    ]
  }
];
