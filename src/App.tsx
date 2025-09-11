// src/App.tsx
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import './App.css';

// ✅ Add Toastify imports
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      {/* ✅ Global toast container, available everywhere */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        newestOnTop
        pauseOnHover
        theme="dark"
      />
    </AuthProvider>
  );
}

export default App;
