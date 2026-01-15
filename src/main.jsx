import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 🛑 我們已經成功殺死殭屍了，現在把清潔工撤除，讓網頁正常呼吸
// 不需要再有 cleanZombieCache 函式了

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)