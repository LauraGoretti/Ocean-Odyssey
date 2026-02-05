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
      { name: 'Flying Fish', emoji: '🐠', depth: 'Surface' },
      { name: 'American Lobster', emoji: '🦞', depth: '50m' }
    ],
    quizzes: [
      {
        id: 'q_gulf_1',
        question: 'The Gulf Stream is famous for being...',
        options: ['Very cold', 'Warm and fast', 'Green and slimy'],
        correctAnswer: 1,
        fact: 'Correct! It acts like a giant heater, bringing warm water from the tropics up north!'
      },
      {
        id: 'q_gulf_2',
        question: 'Which animal might hitch a ride on this current?',
        options: ['Polar Bear', 'Sea Turtle', 'Camel'],
        correctAnswer: 1,
        fact: 'Sea Turtles use the current like a super-highway to travel long distances without swimming hard.'
      }
    ],
    funFacts: [
      'It transports more water than all the world\'s rivers combined!',
      'Benjamin Franklin created one of the first maps of it to help ships deliver mail faster.'
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
      { name: 'Squid', emoji: '🦑', depth: '200m' },
      { name: 'Japanese Spider Crab', emoji: '🦀', depth: '300m' }
    ],
    quizzes: [
      {
        id: 'q_kuro_1',
        question: 'What does "Kuroshio" mean in Japanese?',
        options: ['Black Stream', 'Blue River', 'Fishy Road'],
        correctAnswer: 0,
        fact: 'It is called the Black Stream because the water looks very deep blue, almost black!'
      },
      {
        id: 'q_kuro_2',
        question: 'This current flows past which country?',
        options: ['Brazil', 'Japan', 'Iceland'],
        correctAnswer: 1,
        fact: 'It flows right past Japan, bringing warm water that helps coral reefs grow there.'
      }
    ],
    funFacts: [
      'Its name means "Black Stream" because of its deep, dark blue color.',
      'It helps warm coral reefs grow much further north in Japan than they usually would!'
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
      { name: 'Giant Squid', emoji: '🦑', depth: '600m' },
      { name: 'Marine Iguana', emoji: '🦎', depth: 'Surface' }
    ],
    quizzes: [
      {
        id: 'q_humb_1',
        question: 'The water in the Humboldt Current is...',
        options: ['Boiling Hot', 'Freezing Cold', 'Lukewarm'],
        correctAnswer: 1,
        fact: 'Brrr! It brings very cold water straight up from Antarctica.'
      },
      {
        id: 'q_humb_2',
        question: 'Which bird loves this cold water?',
        options: ['Penguin', 'Parrot', 'Ostrich'],
        correctAnswer: 0,
        fact: 'Yes! Even though it is near the equator, the Galapagos Penguin lives here because the water is cold.'
      }
    ],
    funFacts: [
      'It is the most productive marine ecosystem in the world, producing more fish than anywhere else!',
      'Penguins can live right on the equator in the Galapagos because this current keeps the water so cold.'
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
      { name: 'Great White Shark', emoji: '🦈', depth: '100m' },
      { name: 'Bluebottle Jellyfish', emoji: '🪼', depth: 'Surface' }
    ],
    quizzes: [
      {
        id: 'q_eac_1',
        question: 'This current was made famous in which movie?',
        options: ['Finding Nemo', 'Lion King', 'Frozen'],
        correctAnswer: 0,
        fact: 'Totally dude! Marlin and Dory rode the EAC with the turtles!'
      },
      {
        id: 'q_eac_2',
        question: 'Where does this current start?',
        options: ['New York', 'Great Barrier Reef', 'The Moon'],
        correctAnswer: 1,
        fact: 'It starts at the largest coral reef system in the world!'
      }
    ],
    funFacts: [
      'It can be up to 100 kilometers wide and 500 meters deep!',
      'In the summer, it flows much stronger and faster than in the winter.'
    ]
  },
  {
    id: 'agulhas',
    name: 'Agulhas Current',
    description: 'A super fast warm current flowing down the east coast of Africa.',
    startLocation: 'Madagascar',
    endLocation: 'South Africa',
    color: '#FF9F1C', // Warm Orange
    avgTemp: '20°C',
    avgSpeed: '2.0 m/s',
    path: [
      { lat: -12.0, lng: 49.0 }, // Near Madagascar
      { lat: -18.0, lng: 42.0 }, // Mozambique Channel
      { lat: -25.0, lng: 35.0 }, // Maputo
      { lat: -30.0, lng: 32.0 }, // Durban
      { lat: -35.0, lng: 20.0 }  // Cape Agulhas
    ],
    biodiversity: [
      { name: 'Sardine', emoji: '🐟', depth: 'Surface' },
      { name: 'Great White Shark', emoji: '🦈', depth: 'Surface' },
      { name: 'Bottlenose Dolphin', emoji: '🐬', depth: '10m' },
      { name: 'Hammerhead Shark', emoji: '🦈', depth: '50m' }
    ],
    quizzes: [
      {
        id: 'q_agulhas_1',
        question: 'This current flows along the coast of which continent?',
        options: ['Australia', 'Africa', 'Antarctica'],
        correctAnswer: 1,
        fact: 'It hugs the eastern coast of Africa before meeting the cold Atlantic waters.'
      },
      {
        id: 'q_agulhas_2',
        question: 'It is famous for the "Run" of which tiny fish?',
        options: ['Sardines', 'Goldfish', 'Clownfish'],
        correctAnswer: 0,
        fact: 'Billions of Sardines travel together here, creating a huge underwater buffet for predators!'
      }
    ],
    funFacts: [
      'It is one of the fastest and strongest currents in the entire world.',
      'Where it meets the Atlantic Ocean, it creates massive "rogue waves" that can be 30 meters high!'
    ]
  },
  {
    id: 'california',
    name: 'California Current',
    description: 'A cool, nutrient-rich current moving south along the North American west coast.',
    startLocation: 'British Columbia',
    endLocation: 'Baja California',
    color: '#74B9FF', // Cool Blue
    avgTemp: '15°C',
    avgSpeed: '0.5 m/s',
    path: [
      { lat: 50.0, lng: -128.0 }, // Vancouver Island
      { lat: 45.0, lng: -126.0 }, // Oregon
      { lat: 38.0, lng: -124.0 }, // Bay Area
      { lat: 34.0, lng: -121.0 }, // SoCal
      { lat: 23.0, lng: -110.0 }  // Baja Mexico
    ],
    biodiversity: [
      { name: 'Sea Otter', emoji: '🦦', depth: 'Surface' },
      { name: 'Gray Whale', emoji: '🐋', depth: 'Surface' },
      { name: 'Giant Kelp', emoji: '🌿', depth: '10m' },
      { name: 'Elephant Seal', emoji: '🦭', depth: 'Surface' }
    ],
    quizzes: [
      {
        id: 'q_cal_1',
        question: 'The California Current is...',
        options: ['Boiling Hot', 'Cool and Foggy', 'Purple'],
        correctAnswer: 1,
        fact: 'Cold water meeting warm air creates the famous fog of San Francisco!'
      },
      {
        id: 'q_cal_2',
        question: 'Sea Otters here wrap themselves in what to sleep?',
        options: ['Blankets', 'Kelp', 'Towels'],
        correctAnswer: 1,
        fact: 'They wrap themselves in giant kelp seaweed so they don\'t drift away while napping!'
      }
    ],
    funFacts: [
      'It acts like a giant air conditioner for the coast, keeping summers cool and foggy.',
      'The cold water brings up nutrients from the deep, helping giant kelp forests grow faster than trees!'
    ]
  },
  {
    id: 'acc',
    name: 'Antarctic Circumpolar',
    description: 'The world\'s strongest current! It flows completely around Antarctica, connecting the Atlantic, Pacific, and Indian Oceans.',
    startLocation: 'Drake Passage',
    endLocation: 'Southern Ocean Loop',
    color: '#8e44ad', // Deep Purple
    avgTemp: '2°C',
    avgSpeed: '4.0 m/s',
    path: [
      { lat: -58.0, lng: -65.0 }, // Drake Passage start
      { lat: -50.0, lng: -30.0 }, // South Atlantic
      { lat: -50.0, lng: 70.0 },  // Indian Ocean sector
      { lat: -55.0, lng: 130.0 }, // South of Australia
      { lat: -58.0, lng: 180.0 }, // Mid-Pacific / Date Line
      { lat: -60.0, lng: -160.0 }, // Pacific sector
      { lat: -62.0, lng: -70.0 }  // Back near Drake Passage
    ],
    biodiversity: [
      { name: 'Antarctic Krill', emoji: '🦐', depth: 'Surface' },
      { name: 'Emperor Penguin', emoji: '🐧', depth: 'Surface' },
      { name: 'Orca', emoji: '🐋', depth: 'Surface' },
      { name: 'Wandering Albatross', emoji: '🐦', depth: 'Air' }
    ],
    quizzes: [
      {
        id: 'q_acc_1',
        question: 'This current is special because...',
        options: ['It flows in a circle', 'It is made of jelly', 'It stops in summer'],
        correctAnswer: 0,
        fact: 'It is the only current that flows all the way around the globe without hitting land!'
      },
      {
        id: 'q_acc_2',
        question: 'What tiny animal here feeds almost all the whales?',
        options: ['Ants', 'Krill', 'Goldfish'],
        correctAnswer: 1,
        fact: 'Antarctic Krill exist in massive swarms and are the main food for whales, seals, and penguins!'
      }
    ],
    funFacts: [
      'It carries 100 times more water than all the rivers on Earth combined!',
      'It helps keep Antarctica frozen by blocking warm water from reaching the ice.'
    ]
  },
  {
    id: 'labrador',
    name: 'Labrador Current',
    description: 'A chilly current flowing south from the Arctic Ocean, famous for carrying icebergs down "Iceberg Alley".',
    startLocation: 'Baffin Bay',
    endLocation: 'Newfoundland',
    color: '#a29bfe', // Icy Lavender
    avgTemp: '0°C',
    avgSpeed: '0.6 m/s',
    path: [
      { lat: 70.0, lng: -60.0 }, // Baffin Bay
      { lat: 65.0, lng: -58.0 }, // Davis Strait
      { lat: 60.0, lng: -62.0 }, // Labrador Coast
      { lat: 55.0, lng: -55.0 }, // Down coast
      { lat: 48.0, lng: -50.0 }  // Grand Banks
    ],
    biodiversity: [
      { name: 'Polar Bear', emoji: '🐻‍❄️', depth: 'Surface' },
      { name: 'Beluga Whale', emoji: '🐋', depth: 'Surface' },
      { name: 'Atlantic Puffin', emoji: '🐧', depth: 'Surface' },
      { name: 'Greenland Shark', emoji: '🦈', depth: 'Deep' }
    ],
    quizzes: [
      {
        id: 'q_lab_1',
        question: 'What large floating objects is this current famous for carrying?',
        options: ['Rubber Ducks', 'Icebergs', 'Surfboards'],
        correctAnswer: 1,
        fact: 'It carries huge icebergs from Greenland all the way south to where ships sail!'
      },
      {
        id: 'q_lab_2',
        question: 'When this cold current meets the warm Gulf Stream, what happens?',
        options: ['It explodes', 'Thick Fog forms', 'The water turns purple'],
        correctAnswer: 1,
        fact: 'The mix of freezing cold and super warm water creates some of the thickest fog in the world.'
      }
    ],
    funFacts: [
      'The path it takes is often called "Iceberg Alley" because of all the ice it transports.',
      'The Greenland Shark living here can live to be over 400 years old!'
    ]
  }
];