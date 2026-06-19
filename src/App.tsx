import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import StatusPage from "@/pages/StatusPage";
import PickupPage from "@/pages/PickupPage";
import CustomerPage from "@/pages/CustomerPage";
import StatisticsPage from "@/pages/StatisticsPage";

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
        </Routes>
      </Layout>
    </Router>
  );
}
