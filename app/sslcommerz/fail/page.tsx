"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SSLCommerzFailPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-6">
          Your payment could not be processed. Please try again or use a different payment method.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push("/checkout")}
            className="bg-[#31B65D] hover:bg-[#31B65D]/90 text-white"
          >
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

