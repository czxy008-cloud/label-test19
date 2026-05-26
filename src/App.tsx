import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import InvoiceList from './pages/InvoiceList'
import InvoiceAdd from './pages/InvoiceAdd'
import CategoryManager from './pages/CategoryManager'
import ReimbursePersonManager from './pages/ReimbursePersonManager'
import InvoiceSetManager from './pages/InvoiceSetManager'
import Statistics from './pages/Statistics'
import OperationLogs from './pages/OperationLogs'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/invoices" replace />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/add" element={<InvoiceAdd />} />
        <Route path="invoices/edit/:id" element={<InvoiceAdd />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="reimburse-persons" element={<ReimbursePersonManager />} />
        <Route path="invoice-sets" element={<InvoiceSetManager />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="operation-logs" element={<OperationLogs />} />
      </Route>
    </Routes>
  )
}

export default App
