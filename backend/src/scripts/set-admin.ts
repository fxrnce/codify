import { prisma } from "../lib/prisma.js";
import { clerkClient } from "@clerk/express";

// Server-only command. There is deliberately no public role-assignment endpoint.
const [identifier, role = "ADMIN"] = process.argv.slice(2);
if (!identifier || (!identifier.startsWith("user_") && !identifier.includes("@")) || !["ADMIN", "USER"].includes(role)) {
  console.error("Usage: npm run admin:set -- email@example.com [ADMIN|USER] (or a Clerk user ID)");
  process.exitCode = 1;
} else {
  try {
    let clerkUserId = identifier;
    if (identifier.includes("@")) {
      const { data } = await clerkClient.users.getUserList({ emailAddress: [identifier] });
      const matches = data.filter(user => user.emailAddresses.some(email => email.emailAddress.toLowerCase() === identifier.toLowerCase() && email.verification?.status === "verified"));
      if (matches.length !== 1) throw new Error("Exactly one account with this verified email is required. Check the Clerk user ID instead.");
      clerkUserId = matches[0].id;
    }
    await prisma.user.upsert({
      where: { clerkUserId },
      update: { role: role as "ADMIN" | "USER" },
      create: { clerkUserId, role: role as "ADMIN" | "USER" },
    });
    console.log(`Account role updated to ${role}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unable to update the account role.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
