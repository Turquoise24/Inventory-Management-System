"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  setProducts,
  deleteProduct,
  setLoading,
  setError,
} from "@/store/slices/productSlice";
import { productService } from "@/services/productService";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "react-toastify";

const ProductsPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { products, loading } = useAppSelector((state) => state.product);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      dispatch(setLoading(true));
      const response = await productService.getAllProducts();
      if (response.success && response.data) {
        dispatch(setProducts(response.data));
      }
    } catch (error: any) {
      dispatch(setError(error.message));
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      await productService.deleteProduct(id);
      dispatch(deleteProduct(id));
      toast.success("Product deleted successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        {isAuthenticated && isAdmin && (
          <button
            onClick={() => router.push("/products/new")}
            className="bg-orange-300 hover:bg-orange-400 text-gray-900 px-6 py-2.5 rounded-lg font-medium transition-all"
          >
            Add Product
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-stone-100 rounded-lg border border-stone-200 p-8 text-center">
          <p className="text-gray-600">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-stone-100 rounded-lg border border-stone-200 p-4"
            >
              <div className="space-y-4">
                <div className="w-full h-48 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={
                      product.picture ||
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23ffffff"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'
                    }
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23ffffff"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="%239ca3af"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                    {product.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">SKU</span>
                    <p className="font-medium text-gray-900">{product.sku}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Category</span>
                    <p className="font-medium text-gray-900">
                      {product.category}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Price</span>
                    <p className="font-semibold text-gray-900">
                      ${product.price}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Stock</span>
                    <p className="font-medium text-gray-900">
                      {product.stockQuantity}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/products/${product._id}`)}
                  className="w-full bg-stone-200 hover:bg-stone-300 text-gray-900 py-2 px-4 rounded-lg font-medium transition-all"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
