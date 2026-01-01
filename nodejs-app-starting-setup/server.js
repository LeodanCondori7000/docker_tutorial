import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ======================
// 1. INITIAL SETUP & CONSTANTS
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// 2. APPLICATION STATE
// ======================
let userGoal = 'Learn Docker!';

// ======================
// 3. UTILITY FUNCTIONS
// ======================
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ======================
// 4. MIDDLEWARE SETUP
// ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For JSON API endpoints

// Static files with caching
app.use(express.static('public', {
  maxAge: '1h',
}));

// Custom middleware example (if needed)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// ======================
// 5. ROUTE HANDLERS (WEB)
// ======================
app.get('/', (req, res) => {
  const success = req.query.success;
  const error = req.query.error;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Goal Tracker</title>
        <link rel="stylesheet" href="/styles.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      </head>
      <body>
        <main class="container">
          ${success ? '<div class="alert alert-success">Goal updated successfully!</div>' : ''}
          ${error === 'invalid_goal' ? '<div class="alert alert-error">Please enter a valid goal (1-100 characters)</div>' : ''}
          
          <section class="goal-section">
            <h1><i class="fas fa-bullseye"></i> My Course Goal!!!</h1>
            <div class="goal-display">
              <h2 id="current-goal">${escapeHtml(userGoal)}</h2>
              <small>Last updated: ${new Date().toLocaleDateString()}</small>
            </div>
          </section>
          
          <section class="form-section">
            <form action="/store-goal" method="POST" class="goal-form">
              <div class="form-group">
                <label for="goal">
                  <i class="fas fa-edit"></i> New Course Goal
                </label>
                <input 
                  type="text" 
                  id="goal" 
                  name="goal" 
                  value="${escapeHtml(userGoal)}" 
                  placeholder="Enter your learning goal..."
                  required
                  maxlength="100"
                >
                <div class="char-count" id="charCount">${userGoal.length}/100</div>
              </div>
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i> Update Goal
              </button>
            </form>
          </section>
          
          <footer>
            <p>Track your learning progress!</p>
          </footer>
        </main>
        
        <script>
          // Real-time character count
          document.getElementById('goal').addEventListener('input', (e) => {
            document.getElementById('charCount').textContent = e.target.value.length + '/100';
          });
          
          // Auto-dismiss alerts after 5 seconds
          setTimeout(() => {
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
              alert.style.transition = 'opacity 0.5s';
              alert.style.opacity = '0';
              setTimeout(() => alert.remove(), 500);
            });
          }, 5000);
        </script>
      </body>
    </html>
  `);
});

app.post('/store-goal', (req, res) => {
  const enteredGoal = req.body.goal?.trim();

  if (!enteredGoal || enteredGoal.length > 100) {
    return res.redirect('/?error=invalid_goal');
  }

  userGoal = enteredGoal;
  console.log(`Goal updated: ${userGoal}`);
  res.redirect('/?success=true');
});

// ======================
// 6. API ROUTES
// ======================
app.get('/api/goal', (req, res) => {
  res.json({
    goal: userGoal,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/goal', (req, res) => {
  const newGoal = req.body.goal?.trim();
  if (!newGoal || newGoal.length > 100) {
    return res.status(400).json({
      error: 'Invalid goal. Must be 1-100 characters.'
    });
  }

  userGoal = newGoal;
  res.json({
    success: true,
    goal: userGoal,
    timestamp: new Date().toISOString()
  });
});

// ======================
// 7. ERROR HANDLERS
// ======================
// 404 Handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Page Not Found</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div class="container" style="text-align: center; padding: 50px;">
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href="/" class="btn-primary">Go Home</a>
        </div>
      </body>
    </html>
  `);
});

// Global Error Handler (should be last)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Server Error</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div class="container" style="text-align: center; padding: 50px;">
          <h1>500 - Server Error</h1>
          <p>Something went wrong on our end.</p>
          ${process.env.NODE_ENV === 'development' ? `<pre>${escapeHtml(err.stack)}</pre>` : ''}
          <a href="/" class="btn-primary">Go Home</a>
        </div>
      </body>
    </html>
  `);
});

// ======================
// 8. SERVER STARTUP
// ======================
app.listen(PORT, () => {
  console.log(`
    ========================================
    🚀 Server running on port ${PORT}
    📁 Environment: ${process.env.NODE_ENV || 'development'}
    👉 http://localhost:${PORT}
    ========================================
  `);
});