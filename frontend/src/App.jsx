import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Directory from './pages/Directory.jsx'
import Investigation from './pages/Investigation.jsx'
import Industry from './pages/Industry.jsx'
import Priority from './pages/Priority.jsx'
import Reports from './pages/Reports.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<Dashboard />} />
        <Route path="/directory"     element={<Directory />} />
        <Route path="/investigation" element={<Investigation />} />
        <Route path="/industry"      element={<Industry />} />
        <Route path="/priority"      element={<Priority />} />
        <Route path="/reports"       element={<Reports />} />
      </Routes>
    </Layout>
  )
}
