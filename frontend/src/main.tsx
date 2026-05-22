import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root'
import { seedDemoExpenses } from './lib/demoSeed'

// Seed demo data on first visit (LocalStorage only, runs once)
seedDemoExpenses()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
