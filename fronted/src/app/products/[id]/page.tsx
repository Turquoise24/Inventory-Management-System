"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { productService } from "@/services/productService";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "react-toastify";
import { Product } from "@/types";

const ProductDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProduct(id);
      if (response.success && response.data) {
        setProduct(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch product");
      router.push("/products");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Button onClick={() => router.push("/products")} className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={
                product.picture ||
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'
              }
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="%239ca3af"%3EImage Not Found%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">SKU:</span>
                <span className="text-gray-900">{product.sku}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Category:</span>
                <span className="text-gray-900">{product.category}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Price:</span>
                <span className="text-2xl font-bold text-primary-600">
                  ${product.price.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">
                  Stock Quantity:
                </span>
                <span
                  className={`font-semibold ${
                    product.stockQuantity > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {product.stockQuantity} {product.unit}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Unit:</span>
                <span className="text-gray-900">{product.unit}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    product.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {isAuthenticated && (isAdmin || isStaff) && (
              <div className="border-t pt-4 flex gap-3">
                {isAdmin && (
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/products/${product._id}/edit`)}
                    className="flex-1"
                  >
                    Edit Product
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => router.push("/requests/new")}
                  className="flex-1"
                >
                  Create Request
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductDetailPage;
