import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import StatusPage from "@/pages/StatusPage";
import PickupPage from "@/pages/PickupPage";
import CustomerPage from "@/pages/CustomerPage";
import StatisticsPage from "@/pages/StatisticsPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import ReconciliationPage from "@/pages/ReconciliationPage";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/pickup" element={<PickupPage />} />
          <Route path="/customer" element={<CustomerPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/reconciliation" element={<ReconciliationPage />} />
          <Route path="/order/:id" element={<OrderDetailPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
