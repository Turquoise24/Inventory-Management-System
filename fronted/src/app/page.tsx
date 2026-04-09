"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { healthService } from "@/services/healthService";
import { toast } from "react-toastify";

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

  useEffect(() => {
    const checkBackend = async () => {
      const isHealthy = await healthService.checkHealth();
      setBackendStatus(isHealthy ? "online" : "offline");

      if (!isHealthy) {
        toast.error(
          "⚠️ Backend server is offline. Please start the backend to use the application.",
        );

        // If user is authenticated but backend is down, logout to prevent confusion
        if (isAuthenticated) {
          toast.warning(
            "You have been logged out because the backend is unavailable.",
          );
          dispatch(logout());
        }
      }
    };

    checkBackend();

    // Check every 30 seconds if backend is offline
    const interval = setInterval(() => {
      if (backendStatus === "offline") {
        checkBackend();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, backendStatus, dispatch]);

  return (
    <div className="space-y-12">
      {/* Backend Status Banner */}
      {backendStatus === "offline" && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded"
          role="alert"
        >
          <div className="flex items-center">
            <div className="py-1">
              <svg
                className="fill-current h-6 w-6 text-red-500 mr-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Backend Server Offline</p>
              <p className="text-sm">
                The backend API is unreachable. Please check that the backend is
                deployed and that{" "}
                <code className="bg-red-200 px-1 rounded">
                  NEXT_PUBLIC_API_URL
                </code>{" "}
                is set correctly.
              </p>
            </div>
          </div>
        </div>
      )}

      {backendStatus === "checking" && (
        <div
          className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded"
          role="alert"
        >
          <p className="font-bold">Checking backend connection...</p>
        </div>
      )}

      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16 px-8">
        {/* Left Content */}
        <div className="space-y-6">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Inventory
            <br />
            Management
            <br />
            <span className="text-orange-500">Simplified.</span>
          </h1>

          <p className="text-gray-500 text-lg max-w-md">
            Track products, manage requests, and get real-time notifications
            with StockMe. The modern solution for your warehouse needs.
          </p>

          {!isAuthenticated ? (
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => router.push("/auth/register")}
                disabled={backendStatus === "offline"}
                className="px-8 py-3 bg-orange-400 hover:bg-orange-500 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Started
              </button>
              <button
                onClick={() => router.push("/products")}
                disabled={backendStatus === "offline"}
                className="px-8 py-3 bg-orange-100 hover:bg-orange-200 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                View Products
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xl text-gray-700">
                Welcome back, <span className="font-bold">{user?.name}</span>!
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => router.push("/products")}
                  disabled={backendStatus === "offline"}
                  className="px-8 py-3 bg-orange-400 hover:bg-orange-500 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  View Products
                </button>
                <button
                  onClick={() => router.push("/requests")}
                  disabled={backendStatus === "offline"}
                  className="px-8 py-3 bg-orange-100 hover:bg-orange-200 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Requests
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Image */}
        <div className="relative lg:justify-self-end">
          <div className="relative bg-orange-100 rounded-2xl p-4 transform rotate-2 shadow-lg">
            <div className="bg-white rounded-xl overflow-hidden transform -rotate-2 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
                alt="Warehouse Management"
                className="w-full h-80 lg:h-96 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect width="800" height="600" fill="%234a5568"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="%23ffffff"%3EWarehouse%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
