import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 15000,
})

/**
 * Fetches all businesses from GET /api/scan
 * Returns the data array: [{ Business_ID, City, Industry, Reported_Turnover,
 *   Risk_Score, Is_Suspicious, ElectricityBill, Employee_Count }, ...]
 */
export async function fetchAllBusinesses() {
  const res = await api.get('/scan')
  return res.data.data
}

/**
 * Fetches detail for a single business from GET /api/business/{id}
 * Returns: { business_data: {...}, industry_averages: { avg_electricity_ratio, avg_employee_ratio } }
 */
export async function fetchBusinessById(id) {
  const res = await api.get(`/business/${encodeURIComponent(id)}`)
  return res.data.data
}
