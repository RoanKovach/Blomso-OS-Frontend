import React from 'react'
import ReactDOM from 'react-dom/client'
import { configureAmplifyIfNeeded } from '@/lib/configureAmplify.js'
import App from '@/App.jsx'
import '@/index.css'

configureAmplifyIfNeeded()

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 