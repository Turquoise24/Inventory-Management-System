"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestService } from "@/services/requestService";
import { productService } from "@/services/productService";
import { Request, Product } from "@/types";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAppSelector } from "@/store/hooks";
import { format } from "date-fns";

export default function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [request, setRequest] = useState<Request | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await requestService.getRequest(params.id);
        if (response.success && response.data) {
          setRequest(response.data);

          // Get product details
          const productId =
            typeof response.data.product_id === "string"
              ? response.data.product_id
              : response.data.product_id._id;

          const productResponse = await productService.getProduct(productId);
          if (productResponse.success && productResponse.data) {
            setProduct(productResponse.data);
          }
        }
      } catch (err: any) {
        console.error("Error fetching request:", err);
        if (err.response?.status === 404) {
          setError("This request was not found. It may have been deleted.");
        } else {
          setError(
            err.response?.data?.message || "Failed to load request details",
          );
        }

        // Redirect after showing error briefly
        setTimeout(() => {
          router.push("/requests");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleEdit = () => {
    router.push(`/requests/${params.id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      await requestService.deleteRequest(params.id);
      router.push("/requests");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete request");
    }
  };

  const getUserName = (
    userField: string | { name: string } | undefined,
  ): string => {
    if (!userField) return "Unknown";
    return typeof userField === "string" ? userField : userField.name;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex justify-center items-center min-h-screen">
            <LoadingSpinner size="lg" />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !request) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-4xl mx-auto">
            <Card>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Request Not Found
                </h2>
                <p className="text-gray-600 mb-4">
                  {error ||
                    "This request was not found. It may have been deleted."}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Redirecting to requests page...
                </p>
                <Button onClick={() => router.push("/requests")}>
                  Go to Requests
                </Button>
              </div>
            </Card>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Request Details
            </h1>
            <div className="space-x-2">
              <Button variant="secondary" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={handleEdit}>Edit</Button>
              {isAdmin && (
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
              )}
            </div>
          </div>

          <Card>
            <div className="space-y-6">
              {/* Product Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <div className="text-gray-900">
                  {product ? (
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          SKU: {product.sku}
                        </p>
                        <p className="text-sm text-gray-600">
                          Current Stock: {product.stockQuantity} {product.unit}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/products/${product._id}`)}
                      >
                        View Product
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Product information not available
                    </p>
                  )}
                </div>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <p className="text-gray-900">
                  {request.transactionType === "stockIn" ? (
                    <span className="text-green-600 font-medium">
                      📦 Stock In
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      📤 Stock Out
                    </span>
                  )}
                </p>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <p className="text-gray-900 text-lg font-semibold">
                  {request.itemAmount} {product?.unit || "units"}
                </p>
              </div>

              {/* Transaction Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Date
                </label>
                <p className="text-gray-900">
                  {format(new Date(request.transactionDate), "PPP")}
                </p>
              </div>

              {/* Requested By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested By
                </label>
                <p className="text-gray-900">
                  {getUserName(request.user as any)}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At
                  </label>
                  <p className="text-gray-900">
                    {format(new Date(request.createdAt), "PPpp")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Updated
                  </label>
                  <p className="text-gray-900">
                    {format(new Date(request.updatedAt), "PPpp")}
                  </p>
                </div>
              </div>

              {/* Last Modified By */}
              {request.lastModifiedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Modified By
                  </label>
                  <p className="text-gray-900">
                    {getUserName(request.lastModifiedBy as any)}
                  </p>
                </div>
              )}

              {/* Activity Log */}
              {request.activityLog && request.activityLog.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Log
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {request.activityLog.map((activity, index) => (
                      <div
                        key={index}
                        className="text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0"
                      >
                        <p className="text-gray-900">
                          <span className="font-medium capitalize">
                            {activity.action}
                          </span>{" "}
                          by {getUserName(activity.performedBy as any)}
                        </p>
                        <p className="text-gray-600 text-xs">
                          {format(new Date(activity.performedAt), "PPpp")}
                        </p>
                        {activity.details && (
                          <p className="text-gray-600 text-xs mt-1">
                            {activity.details}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
