/**
 * Recipe Data - Static Recipe Database
 * Used by the hybrid recommendation engine
 */

export const recipes = [
  {
    id: '1',
    name: 'Chicken Curry',
    nameTamil: 'சிக்கன் குழம்பு',
    type: 'curry',
    cuts: ['curry cut', 'bone-in', 'whole'],
    cookingTime: '30 mins',
    prepTime: '15 mins',
    servings: '4',
    difficulty: 'medium',
    ingredients: [
      '500g Chicken (curry cut)',
      '2 Onions',
      '2 Tomatoes',
      'Ginger-Garlic paste',
      'Curry leaves',
      'Turmeric',
      'Red chili powder',
      'Coriander powder',
      'Garam masala',
      'Coconut oil',
    ],
    instructions: [
      'Heat oil in a pan, add curry leaves',
      'Sauté onions until golden',
      'Add ginger-garlic paste, cook for 1 min',
      'Add tomatoes and spices, cook until soft',
      'Add chicken, mix well',
      'Add water, cover and cook for 25-30 mins',
      'Garnish with coriander leaves',
    ],
    tips: 'For richer flavor, add coconut milk at the end',
  },
  {
    id: '2',
    name: 'Chicken Fry',
    nameTamil: 'சிக்கன் ஃப்ரை',
    type: 'fry',
    cuts: ['boneless', 'breast', 'fry cut'],
    cookingTime: '20 mins',
    prepTime: '25 mins',
    servings: '3-4',
    difficulty: 'easy',
    ingredients: [
      '500g Chicken (boneless, cut into pieces)',
      '1 Onion',
      'Ginger-Garlic paste',
      'Red chili powder',
      'Turmeric',
      'Pepper powder',
      'Fennel seeds',
      'Curry leaves',
      'Oil',
    ],
    instructions: [
      'Marinate chicken with spices for 20 mins',
      'Heat oil in a pan',
      'Add fennel seeds and curry leaves',
      'Add sliced onions, fry until golden',
      'Add marinated chicken',
      'Fry on medium heat for 15-20 mins',
      'Cook until chicken is crispy',
    ],
    tips: 'Let the chicken marinate longer for better taste',
  },
  {
    id: '3',
    name: 'Grilled Chicken',
    nameTamil: 'கிரில் சிக்கன்',
    type: 'grill',
    cuts: ['leg piece', 'thigh', 'breast', 'whole'],
    cookingTime: '25 mins',
    prepTime: '20 mins',
    servings: '4',
    difficulty: 'easy',
    ingredients: [
      '500g Chicken (leg pieces or breast)',
      '2 tbsp Yogurt',
      '1 tbsp Lemon juice',
      'Ginger-Garlic paste',
      'Red chili powder',
      'Pepper powder',
      'Garam masala',
      'Oil',
    ],
    instructions: [
      'Mix yogurt, lemon juice, and spices',
      'Marinate chicken for at least 1 hour',
      'Preheat grill or pan',
      'Grill chicken for 12-15 mins each side',
      'Baste with oil while grilling',
      'Rest for 5 mins before serving',
    ],
    tips: 'Use a meat thermometer - internal temp should be 75°C',
  },
  {
    id: '4',
    name: 'Chicken Biryani',
    nameTamil: 'சிக்கன் பிரியாணி',
    type: 'biryani',
    cuts: ['curry cut', 'whole', 'bone-in'],
    cookingTime: '45 mins',
    prepTime: '30 mins',
    servings: '4-5',
    difficulty: 'hard',
    ingredients: [
      '500g Chicken',
      '2 cups Basmati Rice',
      '2 Onions',
      '2 Tomatoes',
      'Yogurt',
      'Biryani masala',
      'Mint leaves',
      'Coriander leaves',
      'Saffron',
      'Ghee',
    ],
    instructions: [
      'Soak rice for 30 mins',
      'Marinate chicken with yogurt and spices',
      'Cook chicken until 70% done',
      'Parboil rice with whole spices',
      'Layer rice over chicken',
      'Add saffron milk, mint, coriander',
      'Dum cook for 20 mins on low heat',
    ],
    tips: 'Seal the pot with dough for authentic dum flavor',
  },
  {
    id: '5',
    name: 'Chicken 65',
    nameTamil: 'சிக்கன் 65',
    type: 'fry',
    cuts: ['boneless', 'breast', 'thigh'],
    cookingTime: '20 mins',
    prepTime: '30 mins',
    servings: '4',
    difficulty: 'medium',
    ingredients: [
      '500g Chicken (boneless)',
      '2 tbsp Corn flour',
      '2 tbsp Rice flour',
      '1 Egg',
      'Red chili powder',
      'Ginger-Garlic paste',
      'Curry leaves',
      'Green chilies',
      'Oil for frying',
    ],
    instructions: [
      'Marinate chicken with spices and egg',
      'Add corn flour and rice flour',
      'Heat oil for deep frying',
      'Fry chicken pieces until golden',
      'Temper curry leaves and green chilies',
      'Toss fried chicken with tempering',
    ],
    tips: 'Double fry for extra crispiness',
  },
  {
    id: '6',
    name: 'Chicken Kebab',
    nameTamil: 'சிக்கன் கபாப்',
    type: 'kebab',
    cuts: ['boneless', 'breast', 'mince'],
    cookingTime: '15 mins',
    prepTime: '25 mins',
    servings: '4',
    difficulty: 'medium',
    ingredients: [
      '500g Chicken mince',
      '1 Onion',
      'Green chilies',
      'Coriander leaves',
      'Garam masala',
      'Kebab masala',
      'Bread crumbs',
      'Oil',
    ],
    instructions: [
      'Mix chicken mince with spices',
      'Add finely chopped onions and herbs',
      'Add bread crumbs for binding',
      'Shape into kebabs',
      'Shallow fry on both sides',
      'Cook until golden brown',
    ],
    tips: 'Refrigerate shaped kebabs for 15 mins before frying',
  },
  {
    id: '7',
    name: 'Chicken Soup',
    nameTamil: 'சிக்கன் சூப்',
    type: 'soup',
    cuts: ['boneless', 'breast', 'bones'],
    cookingTime: '40 mins',
    prepTime: '15 mins',
    servings: '4',
    difficulty: 'easy',
    ingredients: [
      '300g Chicken (breast or bones)',
      '1 Carrot',
      '1 Onion',
      '2 cloves Garlic',
      'Pepper powder',
      'Salt',
      'Coriander leaves',
      'Water',
    ],
    instructions: [
      'Boil chicken with water and salt',
      'Add chopped vegetables',
      'Simmer for 30 mins',
      'Strain the stock',
      'Shred chicken and add back',
      'Add pepper and garnish with coriander',
    ],
    tips: 'Add noodles or rice for a filling meal',
  },
  {
    id: '8',
    name: 'Tandoori Chicken',
    nameTamil: 'தந்தூரி சிக்கன்',
    type: 'tandoori',
    cuts: ['whole', 'leg piece', 'thigh', 'breast'],
    cookingTime: '30 mins',
    prepTime: '2 hours',
    servings: '4',
    difficulty: 'medium',
    ingredients: [
      '1 Whole Chicken (or pieces)',
      '1 cup Yogurt',
      '2 tbsp Tandoori masala',
      '1 tbsp Ginger-Garlic paste',
      'Lemon juice',
      'Red food color (optional)',
      'Kasuri methi',
      'Oil',
    ],
    instructions: [
      'Make slits in chicken',
      'Mix yogurt with all spices',
      'Marinate chicken for 2+ hours',
      'Preheat oven to 220°C',
      'Place chicken on rack',
      'Bake for 30-35 mins, basting occasionally',
      'Finish with lemon juice',
    ],
    tips: 'For smoky flavor, add a piece of charcoal with oil on top',
  },
  {
    id: '9',
    name: 'Chicken Shawarma',
    nameTamil: 'சிக்கன் ஷவர்மா',
    type: 'shawarma',
    cuts: ['boneless', 'breast', 'thigh'],
    cookingTime: '15 mins',
    prepTime: '2 hours',
    servings: '4',
    difficulty: 'medium',
    ingredients: [
      '500g Chicken (boneless, thinly sliced)',
      '3 tbsp Yogurt',
      '1 tsp Cumin powder',
      '1 tsp Coriander powder',
      '1 tsp Paprika',
      '1/2 tsp Turmeric',
      '1 tbsp Lemon juice',
      '2 tbsp Oil',
      'Pita bread / flatbread',
      'Garlic sauce (mayo + garlic)',
      'Sliced onions, tomatoes, cucumber',
    ],
    instructions: [
      'Mix all marinade ingredients with chicken',
      'Marinate for 2 hours (overnight = best)',
      'Cook on hot pan/grill for 10-12 mins, turning once',
      'Slice into thin strips',
      'Warm pita bread, spread garlic sauce',
      'Layer chicken, veggies and roll tightly',
      'Serve immediately',
    ],
    tips: 'Overnight marination gives the best flavor. Add pickles for authentic taste!',
  },
  {
    id: '10',
    name: 'Chicken Lollipop',
    nameTamil: 'சிக்கன் லாலிபாப்',
    type: 'lollipop',
    cuts: ['lollipop', 'wings'],
    cookingTime: '20 mins',
    prepTime: '1 hour',
    servings: '4',
    difficulty: 'medium',
    ingredients: [
      '500g Chicken Lollipop pieces',
      '2 tbsp Soy sauce',
      '1 tbsp Red chilli sauce',
      '1 tbsp Ginger-garlic paste',
      '1 Egg',
      '3 tbsp Cornflour',
      '1 tsp Pepper powder',
      '2 tbsp Butter',
      '1 tbsp Honey',
      'Oil for frying',
    ],
    instructions: [
      'Marinate lollipops with soy sauce, chilli sauce, ginger-garlic, egg, cornflour for 1 hour',
      'Deep fry until golden and cooked through (10-12 mins)',
      'Make sauce: melt butter, add soy + chilli sauce + honey',
      'Toss fried lollipops in sauce',
      'Serve with toothpicks for easy eating',
    ],
    tips: 'Perfect party starter — kids and adults love them!',
  },
  {
    id: '11',
    name: 'Dragon Chicken',
    nameTamil: 'டிராகன் சிக்கன்',
    type: 'dragon',
    cuts: ['dragon cut', 'boneless', 'breast'],
    cookingTime: '25 mins',
    prepTime: '30 mins',
    servings: '4',
    difficulty: 'medium',
    ingredients: [
      '500g Dragon Cut chicken',
      '2 tbsp Soy sauce',
      '1 tbsp Chilli sauce',
      '1 tsp Ginger-garlic paste',
      '1 Egg white',
      '2 tbsp Cornflour',
      '2 Green chillies (slit)',
      '1 Onion (sliced)',
      'Bell peppers (optional)',
      'Spring onions for garnish',
      'Oil for frying',
    ],
    instructions: [
      'Marinate chicken with soy sauce, chilli sauce, ginger-garlic, egg white and cornflour for 30 mins',
      'Deep fry marinated pieces until golden and crispy (8-10 mins)',
      'In a wok, heat 2 tbsp oil — sauté onions and green chillies',
      'Add fried chicken, toss with extra soy sauce and chilli sauce',
      'Add bell peppers, stir fry 2 mins',
      'Garnish with spring onions and serve hot',
    ],
    tips: 'Use Dragon Cut for best presentation — the long pieces look stunning!',
  },
  {
    id: '12',
    name: 'Chicken Tikka',
    nameTamil: 'சிக்கன் திக்கா',
    type: 'tikka',
    cuts: ['boneless', 'breast', 'thigh'],
    cookingTime: '20 mins',
    prepTime: '2 hours',
    servings: '4',
    difficulty: 'medium',
    ingredients: [
      '500g Chicken (boneless cubes)',
      '4 tbsp Thick yogurt',
      '1 tbsp Ginger-garlic paste',
      '1 tsp Red chilli powder',
      '1 tsp Garam masala',
      '1 tsp Cumin powder',
      '1 tbsp Lemon juice',
      '2 tbsp Oil',
      'Salt to taste',
    ],
    instructions: [
      'Mix all marinade ingredients and coat chicken well',
      'Marinate for minimum 2 hours (4 hours = best)',
      'Thread onto skewers or place on baking tray',
      'Grill/bake at 220°C for 15-18 mins, turning halfway',
      'Brush with butter in last 2 mins for shine',
      'Serve with mint chutney and onion rings',
    ],
    tips: 'For Malai Tikka: replace chilli with cream + cashew paste for a mild, creamy version!',
  },
  {
    id: '13',
    name: 'Chicken Wings',
    nameTamil: 'சிக்கன் இறக்கைகள்',
    type: 'wings',
    cuts: ['wings'],
    cookingTime: '30 mins',
    prepTime: '15 mins',
    servings: '4',
    difficulty: 'easy',
    ingredients: [
      '500g Chicken Wings',
      '2 tbsp Soy sauce',
      '1 tbsp Hot sauce / red chilli sauce',
      '1 tbsp Honey',
      '1 tsp Garlic powder',
      '1 tsp Paprika',
      '2 tbsp Cornflour',
      'Salt and pepper',
    ],
    instructions: [
      'Pat wings dry with paper towel (key for crispiness!)',
      'Toss with cornflour, salt and pepper',
      'Bake at 220°C for 25 mins, flip halfway',
      'Mix soy sauce + hot sauce + honey + garlic powder',
      'Toss baked wings in sauce',
      'Bake 5 more mins until caramelized',
    ],
    tips: 'Drying the wings before cooking = extra crispy skin!',
  },
];

/**
 * Get recipe by type
 * @param {string} type - Recipe type (curry, fry, grill, etc.)
 * @returns {Array} Matching recipes
 */
export const getRecipesByType = (type) => {
  if (!type) return [];
  const typeLower = type.toLowerCase();
  return recipes.filter((r) => r.type === typeLower);
};

/**
 * Get recipe by cut preference
 * @param {string} cut - Chicken cut type
 * @returns {Array} Matching recipes
 */
export const getRecipesByCut = (cut) => {
  if (!cut) return [];
  const cutLower = cut.toLowerCase();
  return recipes.filter((r) =>
    r.cuts.some((c) => c.toLowerCase().includes(cutLower))
  );
};

/**
 * Search recipes by name
 * @param {string} query - Search query
 * @returns {Array} Matching recipes
 */
export const searchRecipes = (query) => {
  if (!query) return [];
  const queryLower = query.toLowerCase();
  return recipes.filter(
    (r) =>
      r.name.toLowerCase().includes(queryLower) ||
      r.nameTamil?.toLowerCase().includes(queryLower) ||
      r.type.toLowerCase().includes(queryLower)
  );
};

/**
 * Get recipe by ID
 * @param {string} id - Recipe ID
 * @returns {Object|undefined} Recipe object
 */
export const getRecipeById = (id) => {
  return recipes.find((r) => r.id === id);
};

/**
 * Get all recipes
 * @returns {Array} All recipes
 */
export const getAllRecipes = () => {
  return recipes;
};

export default {
  recipes,
  getRecipesByType,
  getRecipesByCut,
  searchRecipes,
  getRecipeById,
  getAllRecipes,
};
