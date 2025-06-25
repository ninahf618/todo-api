import express, { Request, Response } from "express";
import todoRoutes from "./routes/todos";

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Todo API is running');
});

app.use('/api', todoRoutes);

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
