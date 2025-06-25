import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();


router.get('/todos', async (req: Request, res: Response) => {
  const { title, body, due_date_start, due_date_end, completed} = req.query;

  try {
    const todos = await prisma.todo.findMany({
      where: {
        ...(title && { title: { contains: String(title) } }), 
        ...(body && { body: { contains: String(body) } }), 
        ...(due_date_start || due_date_end
          ? {
            due_date: {
              ...(due_date_start && { gte: new Date(String(due_date_start)) }), 
              ...(due_date_end && { lte: new Date(String(due_date_end)) }), 
            },
          }
      :  {}),
      ...(completed !== undefined && {
        completed_at: completed == 'true' ? { not: null} : null, 
      }), 
      }, 
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json(todos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
  }); 

router.get('/todos/:id', async (req, res)=> {
  const { id } = req.params;
  const numericId = Number(id)

  if (isNaN(numericId)) {
    res.status(400).json({ error: 'Invalid ID'})
    return;
  }
  try{
    const todo = await prisma.todo.findUnique({
      where: { id: numericId }, 
    });

    if (!todo) {
      res.status(404).json({ error: 'Todo not found' })
      return;
    }

    res.json(todo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


router.post('/todos', async (req: Request, res: Response) => {
  const { title, body, due_date } = req.body;

  if (!title) {
    res.status(400).json({ error: 'A title is required' });
    return;
  }

  try {
    const newTodo = await prisma.todo.create({
      data: {
        title,
        body,
        due_date: due_date ? new Date(due_date) : null,
      },
    });
    res.status(201).json(newTodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


router.patch('/todos/:id', async (req, res)=> {
  const { id } = req.params;
  const { title, body, due_date, completed_at } = req.body;

  try {
    const existingTodo = await prisma.todo.findUnique({
      where: { id: Number(id) }, 
    });

    if (!existingTodo) {
      res.status(404).json({ error: 'Todo not found'})
      return;
    }
    const updatedTodo = await prisma.todo.update({
      where: { id: Number(id) }, 
      data: {
        title: title ?? existingTodo.title, 
        body: existingTodo.body, 
        due_date: due_date ? new Date(due_date) : existingTodo.due_date, 
        completed_at: completed_at? new Date(completed_at) : existingTodo.completed_at, 
      }, 
    });

    res.json(updatedTodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


router.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existingTodo = await prisma.todo.findUnique({
      where: { id: Number(id) },
    });

    if (!existingTodo) {
      res.status(404).json({ error: 'Todo not found'})
      return;
    }

    await prisma.todo.delete({
      where: { id: Number(id) }, 
    });

    res.json({});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


router.post('/todos/:id/duplicate' ,async (req, res) => {
  const { id } = req.params;

  try {
    const existingTodo = await prisma.todo.findUnique({
      where: { id: Number(id)}, 
    });

    if (!existingTodo) {
      res.status(404).json({ error: 'Todo not found'})
      return;
    }
    const duplicatedTodo = await prisma.todo.create({
      data: {
        title: `Copy of ${existingTodo.title}. `, 
        body: existingTodo.body, 
        due_date: null, 
        completed_at: null,
      },
    });

    res.status(201).json(duplicatedTodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;