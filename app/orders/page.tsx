import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerOrders, type Order } from "@/actions/orders";
import Link from "next/link";
import { Package, ArrowRight, Calendar, DollarSign } from "lucide-react";
import Image from "next/image";
import { cookies } from "next/headers";

// Helper to get user from cookies/localStorage (we'll need to check how auth is stored)
async function getUserId(): Promise<number | null> {
  // Since we're using localStorage for auth, we need to pass user ID differently
  // For now, we'll make this a client component but fix the hydration issue
  return null;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusColor(status: string) {
  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    processing: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
    "on-hold": "bg-orange-100 text-orange-800",
  };
  return statusColors[status] || "bg-gray-100 text-gray-800";
}

function getStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
}

// Client component for the actual orders display
import OrdersClient from "./OrdersClient";

export default async function OrdersPage() {
  // This will be handled by the client component since we use localStorage
  // We'll pass an empty array initially and let the client fetch
  return <OrdersClient />;
}
