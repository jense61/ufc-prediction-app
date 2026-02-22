import "dotenv/config";
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";

const MOCK_EVENT_NAME = "UFC 999";

async function seedUsers() {
  const passwordHash = await bcrypt.hash("Test12345!", 12);

  await prisma.user.upsert({
    where: { email: "alex@testufc.local" },
    update: { username: "Alex", passwordHash },
    create: {
      username: "Alex",
      email: "alex@testufc.local",
      passwordHash
    }
  });

  await prisma.user.upsert({
    where: { email: "sam@testufc.local" },
    update: { username: "Sam", passwordHash },
    create: {
      username: "Sam",
      email: "sam@testufc.local",
      passwordHash
    }
  });
}

async function seedEvent() {
  await prisma.event.deleteMany({
    where: {
      name: MOCK_EVENT_NAME
    }
  });

  const eventDate = addDays(new Date(), 3);

  await prisma.event.create({
    data: {
      name: MOCK_EVENT_NAME,
      date: eventDate,
      location: "Brussels, Belgium",
      isCompleted: false,
      fights: {
        create: [
          {
            division: "Lightweight",
            isTitleFight: false,
            fighter1Name: "Max Rivera",
            fighter1Record: "22-4-0",
            fighter1Age: "29",
            fighter1Height: "5'10\"",
            fighter1Reach: "72\"",
            fighter2Name: "Liam Novak",
            fighter2Record: "19-3-0",
            fighter2Age: "31",
            fighter2Height: "5'9\"",
            fighter2Reach: "71\""
          },
          {
            division: "Featherweight",
            isTitleFight: false,
            fighter1Name: "Rico Silva",
            fighter1Record: "16-2-0",
            fighter1Age: "27",
            fighter1Height: "5'8\"",
            fighter1Reach: "69\"",
            fighter2Name: "Daniel Frost",
            fighter2Record: "18-5-0",
            fighter2Age: "30",
            fighter2Height: "5'10\"",
            fighter2Reach: "70\""
          },
          {
            division: "Welterweight",
            isTitleFight: false,
            fighter1Name: "Khaled Amir",
            fighter1Record: "21-6-0",
            fighter1Age: "33",
            fighter1Height: "6'0\"",
            fighter1Reach: "74\"",
            fighter2Name: "Jonas Cole",
            fighter2Record: "14-1-0",
            fighter2Age: "26",
            fighter2Height: "5'11\"",
            fighter2Reach: "73\""
          },
          {
            division: "Middleweight",
            isTitleFight: true,
            fighter1Name: "Victor Kane",
            fighter1Record: "24-2-0",
            fighter1Age: "32",
            fighter1Height: "6'1\"",
            fighter1Reach: "77\"",
            fighter2Name: "Mateo Ruiz",
            fighter2Record: "20-4-0",
            fighter2Age: "31",
            fighter2Height: "6'2\"",
            fighter2Reach: "78\""
          },
          {
            division: "Heavyweight",
            isTitleFight: false,
            fighter1Name: "Bruno Stark",
            fighter1Record: "12-3-0",
            fighter1Age: "34",
            fighter1Height: "6'4\"",
            fighter1Reach: "80\"",
            fighter2Name: "Igor Petrov",
            fighter2Record: "15-2-0",
            fighter2Age: "29",
            fighter2Height: "6'5\"",
            fighter2Reach: "82\""
          }
        ]
      }
    }
  });
}

async function main() {
  await seedUsers();
  await seedEvent();

  console.log("Mock seed done.");
  console.log("Event: UFC 999 (future date, 5 main-card fights)");
  console.log("Users: alex@testufc.local and sam@testufc.local");
  console.log("Password for both: Test12345!");
}

main()
  .catch((error) => {
    console.error("Mock seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });