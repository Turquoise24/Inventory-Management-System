"use client";

import React, { useState, useRef } from "react";

interface ImageUploadProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  required?: boolean;
  maxSize?: number; // in MB
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
  maxSize = 5, // 5MB default
}) => {
  const [preview, setPreview] = useState<string>(value);
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Image size must be less than ${maxSize}MB`);
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onChange(name, base64String);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to process image");
      setIsUploading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPreview(url);
    onChange(name, url);
  };

  const handleRemove = () => {
    setPreview("");
    onChange(name, "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Preview */}
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-40 h-40 object-cover rounded-lg border-2 border-gray-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="16" fill="%23999"%3EInvalid Image%3C/text%3E%3C/svg%3E';
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Options */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id={`file-${name}`}
          />
          <label htmlFor={`file-${name}`} className="cursor-pointer">
            <div
              className={`w-full px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-center ${
                isUploading
                  ? "bg-gray-200 text-gray-800 cursor-not-allowed"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {isUploading ? "Uploading..." : "📁 Choose File"}
            </div>
          </label>
        </div>
      </div>

      {/* URL Input */}
      <input
        type="url"
        placeholder="Or paste image URL"
        value={value.startsWith("data:") ? "" : value}
        onChange={handleUrlChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-gray-500">
        Upload an image (max {maxSize}MB) or enter an image URL
      </p>
    </div>
  );
};

export default ImageUpload;
