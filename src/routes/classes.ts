import express from "express";
import { db } from "../db/index.js";
import { classes } from "../db/schema/index.js";
import { create } from "node:domain";

const classesRouter = express.Router();
classesRouter.post("/", async (req, res) => {
  // Implementation for creating a class
  try {
    const [createdClass] = await db
      .insert(classes)
      .values({
        ...req.body,
        inviteCode: Math.random().toString(36).substring(2, 9),
        schedules: [],
      })
      .returning({ id: classes.id });

    if (!createdClass) throw Error;
    res.status(201).json({ data: createdClass });
  } catch (error) {
    console.log(`POST /classes error ${error}`);
    res.status(500).json({ error: error });
  }
});

export default classesRouter;
