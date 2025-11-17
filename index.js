const express = require('express');
const dotenv = require('dotenv');
const commentRoutes = require('./routes/commentRoutes');
const authRoutes = require('./routes/authRoutes'); // 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Routes
app.use('/api/comments', commentRoutes); 
app.use('/api', authRoutes);            

// Health check
app.get('/', (req, res) => {
  res.send(' Social AI Agent backend is live!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});