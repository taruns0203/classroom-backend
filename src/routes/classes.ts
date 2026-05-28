import express from "express";
import { or, ilike, sql, eq, getTableColumns, desc, and } from "drizzle-orm";
import { classes, subjects, departments } from "../db/schema/index.js";
import { user } from "../db/schema/auth.js";
import { db } from "../db/index.js";
import { get } from "node:http";

const classesRouter = express.Router();

classesRouter.get("/", async (req, res) => {
  try {
    const { search, subject, teacher, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
    const limitPerPage = Math.min(
      Math.max(1, parseInt(String(limit), 10) || 10),
      100,
    );
    const offset = (currentPage - 1) * limitPerPage;
    const filterConditions = [];

    if (search) {
      filterConditions.push(
        or(
          ilike(classes.name, `%${search}%`),
          ilike(classes.inviteCode, `%${search}%`),
        ),
      );
    }

    if (subject) {
      const subjectPattern = `%${String(subject).replace(/[%_]/g, "\\$&")}%`;
      filterConditions.push(ilike(subjects.name, subjectPattern));
    }

    if (teacher) {
      const teacherPattern = `%${String(teacher).replace(/[%_]/g, "\\$&")}%`;
      filterConditions.push(ilike(user.name, teacherPattern));
    }

    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const classList = await db
      .select({
        ...getTableColumns(classes),
        subject: { ...getTableColumns(subjects) },
        teacher: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        },
      })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(whereClause)
      .orderBy(desc(classes.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: classList,
      pagination: {
        total: totalCount,
        page: currentPage,
        limit: limitPerPage,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error(`GET /classes error: ${error}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Get class details with teacher, subject and department
classesRouter.get("/:id", async (req, res) => {
  const classId = Number(req.params.id);

  if (!Number.isFinite(classId)) {
    return res.status(400).json({ error: "No class Found" });
  }

  const [classDetails] = await db
    .select({
      ...getTableColumns(classes),
      subject: {
        ...getTableColumns(subjects),
      },
      department: {
        ...getTableColumns(departments),
      },
      teachers: {
        ...getTableColumns(user),
      },
    })
    .from(classes)
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .leftJoin(user, eq(classes.teacherId, user.id))
    .leftJoin(departments, eq(subjects.departmentId, departments.id))
    .where(eq(classes.id, classId));

  if (!classDetails) {
    res.status(404).json({ error: "Class not found" });
  }

  res.status(200).json({ data: classDetails });
});

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
