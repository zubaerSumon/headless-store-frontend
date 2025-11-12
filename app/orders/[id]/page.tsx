"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth-utils";
import { getOrder, type Order } from "@/actions/orders";
import Link from "next/link";
import { ArrowLeft, Calendar, DollarSign, Package, MapPin, User } from "lucide-react";
import Image from "next/image";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function OrderDetailPage({ params }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      const resolvedParams = await params;
      const id = resolvedParams.id;
      setOrderId(id);

      try {
        const result = await getOrder(parseInt(id));
        if (result.success && result.order) {
          setOrder(result.order);
        } else {
          setError(result.error || "Order not found");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while loading order");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [router, params]);

  if (!isAuthenticated()) {
    return null; // Will redirect
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "The order you're looking for doesn't exist."}</p>
          <Link href="/orders">
            <Button>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/orders" className="inline-flex items-center text-lg font-medium mb-6 hover:text-primary transition-colors">
        <ArrowLeft className="mr-2 w-4 h-4" />
        Back to Orders
      </Link>

      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.id}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(order.date_created)}
              </div>
            </div>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.line_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    {item.image && (
                      <Image
                        src={item.image.src}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{item.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-lg font-bold mt-2">
                        {order.currency} {item.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {order.currency} {(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Addresses */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{order.currency} {order.total}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{order.currency} {order.total}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          {order.billing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {order.billing.first_name} {order.billing.last_name}
                  <br />
                  {order.billing.email}
                  {order.billing.phone && (
                    <>
                      <br />
                      {order.billing.phone}
                    </>
                  )}
                  <br />
                  {order.billing.address_1}
                  {order.billing.address_2 && (
                    <>
                      <br />
                      {order.billing.address_2}
                    </>
                  )}
                  <br />
                  {order.billing.city}, {order.billing.state} {order.billing.postcode}
                  <br />
                  {order.billing.country}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Shipping Address */}
          {order.shipping && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

