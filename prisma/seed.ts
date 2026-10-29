import { PrismaClient } from "@prisma/client";
import { DEFAULT_USER_ID } from "../src/lib/constants";

const prisma = new PrismaClient();

// Values per serving, rounded from USDA FoodData Central.
const DEFAULT_FOODS = [
  // Proteins
  { name: "Egg, large", servingSize: "1 egg (50 g)", calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { name: "Chicken breast, cooked, skinless", servingSize: "100 g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Salmon, cooked", servingSize: "100 g", calories: 206, protein: 22, carbs: 0, fat: 12 },
  { name: "Tuna, canned in water", servingSize: "100 g", calories: 116, protein: 26, carbs: 0, fat: 0.8 },
  { name: "Lean ground beef (90/10), cooked", servingSize: "100 g", calories: 217, protein: 26, carbs: 0, fat: 12 },
  { name: "Tofu, firm", servingSize: "100 g", calories: 144, protein: 17, carbs: 2.8, fat: 8.7 },
  { name: "Whey protein powder", servingSize: "1 scoop (30 g)", calories: 120, protein: 24, carbs: 3, fat: 1.5 },

  // Dairy
  { name: "Greek yogurt, plain nonfat", servingSize: "1 container (170 g)", calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { name: "Cottage cheese, 2%", servingSize: "½ cup (113 g)", calories: 92, protein: 12, carbs: 5, fat: 2.5 },
  { name: "Milk, 2%", servingSize: "1 cup (240 ml)", calories: 122, protein: 8, carbs: 12, fat: 4.8 },
  { name: "Cheddar cheese", servingSize: "1 oz (28 g)", calories: 114, protein: 7, carbs: 0.4, fat: 9.4 },

  // Grains & starches
  { name: "Oats, rolled (dry)", servingSize: "½ cup (40 g)", calories: 150, protein: 5, carbs: 27, fat: 2.5 },
  { name: "Brown rice, cooked", servingSize: "1 cup (195 g)", calories: 216, protein: 5, carbs: 45, fat: 1.8 },
  { name: "White rice, cooked", servingSize: "1 cup (158 g)", calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
  { name: "Whole wheat bread", servingSize: "1 slice (32 g)", calories: 81, protein: 4, carbs: 14, fat: 1.1 },
  { name: "Whole wheat pasta, cooked", servingSize: "1 cup (140 g)", calories: 174, protein: 7.5, carbs: 37, fat: 0.8 },
  { name: "Quinoa, cooked", servingSize: "1 cup (185 g)", calories: 222, protein: 8.1, carbs: 39, fat: 3.6 },
  { name: "Sweet potato, baked", servingSize: "1 medium (114 g)", calories: 103, protein: 2.3, carbs: 24, fat: 0.2 },

  // Legumes
  { name: "Black beans, cooked", servingSize: "½ cup (86 g)", calories: 114, protein: 7.6, carbs: 20, fat: 0.5 },
  { name: "Lentils, cooked", servingSize: "½ cup (99 g)", calories: 115, protein: 9, carbs: 20, fat: 0.4 },

  // Fruit
  { name: "Banana", servingSize: "1 medium (118 g)", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: "Apple", servingSize: "1 medium (182 g)", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: "Blueberries", servingSize: "1 cup (148 g)", calories: 84, protein: 1.1, carbs: 21, fat: 0.5 },
  { name: "Strawberries", servingSize: "1 cup (152 g)", calories: 49, protein: 1, carbs: 12, fat: 0.5 },

  // Vegetables
  { name: "Broccoli, steamed", servingSize: "1 cup (156 g)", calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
  { name: "Spinach, raw", servingSize: "2 cups (60 g)", calories: 14, protein: 1.7, carbs: 2.2, fat: 0.2 },

  // Fats
  { name: "Avocado", servingSize: "½ fruit (100 g)", calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { name: "Almonds", servingSize: "1 oz / ~23 nuts (28 g)", calories: 164, protein: 6, carbs: 6.1, fat: 14.2 },
  { name: "Peanut butter", servingSize: "2 tbsp (32 g)", calories: 190, protein: 7, carbs: 7, fat: 16 },
  { name: "Olive oil", servingSize: "1 tbsp (14 g)", calories: 119, protein: 0, carbs: 0, fat: 13.5 },
];

async function main() {
  // The single MVP user, with sensible defaults until onboarding replaces them.
  await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: { id: DEFAULT_USER_ID },
  });

  // Idempotent: re-running the seed only inserts foods that are missing.
  let created = 0;
  for (const food of DEFAULT_FOODS) {
    const exists = await prisma.foodItem.findFirst({
      where: { name: food.name, isCustom: false },
      select: { id: true },
    });
    if (!exists) {
      await prisma.foodItem.create({ data: { ...food, isCustom: false } });
      created++;
    }
  }

  console.log(`Seeded user "${DEFAULT_USER_ID}" and ${created} new foods (${DEFAULT_FOODS.length} defaults total).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
