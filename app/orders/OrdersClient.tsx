"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated, getUser } from "@/lib/auth-utils";
import { getCustomerOrders, type Order } from "@/actions/orders";
import Link from "next/link";
import { Package, ArrowRight, Calendar, DollarSign } from "lucide-react";
import Image from "next/image";

export default function OrdersClient() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchOrders = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      const user = getUser();
      if (!user) {
        setError("User information not found");
        setLoading(false);
        return;
      }

      try {
        // Try with customer ID first, then fallback to email
        const result = await getCustomerOrders(user.id, user.email);
        if (result.success && result.orders) {
          setOrders(result.orders);
          // Clear the refresh flag if it was set
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('order_just_created');
          }
        } else {
          setError(result.error || "Failed to load orders");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while loading orders");
      } finally {
        setLoading(false);
      }
    };

    // Check if we should refresh (e.g., after order creation)
    const shouldRefresh = typeof window !== 'undefined' 
      ? sessionStorage.getItem('order_just_created')
      : null;

    if (shouldRefresh) {
      // Longer delay for SSL Commerz/IPN orders to ensure order is fully created in WooCommerce
      // IPN might take a few seconds to process
      setTimeout(() => {
        fetchOrders();
        // Retry once more after additional delay in case IPN was slow
        setTimeout(() => {
          fetchOrders();
        }, 3000);
      }, 3000);
    } else {
      fetchOrders();
    }
  }, [router, mounted]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      processing: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
      "on-hold": "bg-orange-100 text-orange-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    const user = getUser();
    if (user) {
      try {
        const result = await getCustomerOrders(user.id, user.email);
        if (result.success && result.orders) {
          setOrders(result.orders);
        } else {
          setError(result.error || "Failed to load orders");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while loading orders");
      } finally {
        setLoading(false);
      }
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Error Loading Orders</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Link href="/">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">No Orders Yet</h2>
            <p className="text-gray-500 mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link href="/">
              <Button>
                Start Shopping
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.id}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.date_created)}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {order.currency} {order.total}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-2">Items:</h3>
                    <div className="space-y-2">
                      {order.line_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-2 bg-gray-50 rounded"
                        >
                          {item.image && (
                            <Image
                              src={item.image.src}
                              alt={item.name}
                              width={50}
                              height={50}
                              className="rounded object-contain"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity} × {order.currency} {item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shipping && (
                    <div>
                      <h3 className="font-semibold mb-2">Shipping Address:</h3>
                      <p className="text-sm text-gray-600">
                        {order.shipping.first_name} {order.shipping.last_name}
                        <br />
                        {order.shipping.address_1}
                        {order.shipping.address_2 && (
                          <>
                            <br />
                            {order.shipping.address_2}
                          </>
                        )}
                        <br />
                        {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}
                        <br />
                        {order.shipping.country}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline">
                        View Details
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

