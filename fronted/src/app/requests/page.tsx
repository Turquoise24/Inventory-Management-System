"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  setRequests,
  deleteRequest,
  setLoading,
} from "@/store/slices/requestSlice";
import { setProducts } from "@/store/slices/productSlice";
import { requestService } from "@/services/requestService";
import { productService } from "@/services/productService";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Request, Product } from "@/types";

const RequestsPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { requests, loading } = useAppSelector((state) => state.request);
  const { user } = useAppSelector((state) => state.auth);
  const { products } = useAppSelector((state) => state.product);

  useEffect(() => {
    fetchRequests();
    fetchProducts();

    // Real-time polling: Auto-refresh requests every 5 seconds
    const pollInterval = setInterval(() => {
      fetchRequests();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await requestService.getAllRequests();
      if (response.success && response.data) {
        dispatch(setRequests(response.data));
      }
    } catch (error: any) {
      // Silently fail for background polling
      console.error("Failed to fetch requests:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      if (response.success && response.data) {
        dispatch(setProducts(response.data));
      }
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;

    try {
      const response = await requestService.deleteRequest(id);
      dispatch(deleteRequest(id));
      toast.success("Request deleted successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getProductName = (productId: string | Product): string => {
    if (typeof productId === "object") {
      return productId.name;
    }
    const product = products.find((p) => p._id === productId);
    return product?.name || "Unknown Product";
  };

  const getUserName = (userField: any): string => {
    if (!userField) return "Unknown";
    if (typeof userField === "string") return userField;
    return userField.name || "Unknown";
  };

  const isAdmin = user?.role === "admin";

  // Filter requests for staff to show only their own
  const filteredRequests = isAdmin
    ? requests
    : requests.filter((request) => {
        const requestUserId =
          typeof request.user === "object" ? request.user._id : request.user;
        return requestUserId === user?._id;
      });

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Transaction Requests
          </h1>
          <button
            onClick={() => router.push("/requests/new")}
            className="bg-orange-300 hover:bg-orange-400 text-gray-900 px-6 py-2.5 rounded-lg font-medium transition-all"
          >
            Add Request
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-stone-100 rounded-lg border border-stone-200 p-8 text-center">
            <p className="text-gray-600">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
              <thead className="bg-stone-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Requested By
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="bg-white hover:bg-stone-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(
                        new Date(request.transactionDate),
                        "MMM dd, yyyy",
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getProductName(request.product_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-sm rounded-full ${
                          request.transactionType === "stockIn"
                            ? "bg-green-200 text-gray-900"
                            : "bg-red-200 text-gray-900"
                        }`}
                      >
                        {request.transactionType === "stockIn"
                          ? "Stock In"
                          : "Stock Out"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.itemAmount}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getUserName(request.user)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() =>
                          router.push(`/requests/${request._id}/edit`)
                        }
                        className="bg-yellow-200 hover:bg-yellow-300 text-gray-900 px-4 py-1.5 rounded-lg font-medium transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(request._id)}
                        className="bg-red-300 hover:bg-red-400 text-gray-900 px-4 py-1.5 rounded-lg font-medium transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default RequestsPage;
