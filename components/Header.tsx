"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCategories } from "@/actions/categories";
import { useCart } from "@/hooks/use-cart";
import { isAuthenticated, getUser, logout } from "@/lib/auth-utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Minus, Plus, X, ArrowRight } from "lucide-react";

function Header() {
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const {
    isOpen,
    setIsOpen,
    items: cartItems,
    updateQuantity,
    removeItem: removeFromCart,
    cartTotal,
  } = useCart();

  useEffect(() => {
    setMounted(true);
    // Load categories
    getCategories().then((categories) => {
      // Filter out "Uncategorized" category
      const filtered = (categories || []).filter(
        (category: any) =>
          category.slug !== "uncategorized" &&
          category.name?.toLowerCase() !== "uncategorized"
      );
      setCategoryList(filtered);
    });

    // Check authentication
    setIsAuth(isAuthenticated());
    const currentUser = getUser();
    setUser(currentUser);
  }, []);

  const totalCartItems = mounted
    ? cartItems.reduce((total, item) => total + item.quantity, 0)
    : 0;

  return (
    <div className="p-5 shadow-md flex justify-between">
      {/* Left */}
      <div className="flex items-center gap-8">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="logo"
            width={150}
            height={100}
            className="h-auto"
          />
        </Link>

        {/* Category */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <h2 className="hidden md:flex items-center gap-2 border rounded-full p-2 px-10 bg-slate-200 cursor-pointer hover:bg-slate-300 transition-colors">
              <LayoutGrid className="h-5 w-5" /> Category
            </h2>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Browse Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categoryList.map((category) => (
              <Link
                key={category.id}
                href={`/product-category/${category.slug}`}
              >
                <DropdownMenuItem className="flex gap-4 items-center cursor-pointer">
                  {category.image && (
                    <Image
                      src={category.image.src || "/product-placeholder.jpeg"}
                      alt={category.name}
                      width={30}
                      height={30}
                      className="rounded"
                    />
                  )}
                  <h2 className="text-lg">{category.name}</h2>
                </DropdownMenuItem>
              </Link>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <form
          action="/search"
          method="get"
          className="hidden md:flex gap-3 items-center border rounded-full p-2 px-5"
        >
          <Search className="w-4 h-4" />
          <input
            type="text"
            name="q"
            placeholder="Search"
            className="outline-none bg-transparent"
            defaultValue=""
          />
        </form>
      </div>

      {/* Right */}
      <div className="flex gap-5 items-center">
        {/* Cart */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <h2 className="flex gap-2 items-center text-lg cursor-pointer">
              <ShoppingBag className="w-7 h-7" />
              <span className="bg-[#31B65D] text-white px-2 rounded-full">
                {totalCartItems}
              </span>
            </h2>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Your Cart</SheetTitle>
            </SheetHeader>
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh]">
                <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-auto p-6">
                  <ul className="space-y-6">
                    {cartItems.map((item) => (
                      <li key={item.id} className="flex gap-4">
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                          <Image
                            src={item.image?.src || "/product-placeholder.jpeg"}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="h-full w-full object-contain p-2"
                          />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>{item.name}</h3>
                            <p className="ml-4">${item.price}</p>
                          </div>
                          <div className="flex items-center mt-2">
                            <button
                              className="rounded-md border p-1"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="mx-2 w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              className="rounded-md border p-1"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            className="rounded-md border p-1"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="w-5 h-5" />
                            <span className="sr-only">Remove</span>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-200 p-6 mt-auto">
                    <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                      <p>Subtotal</p>
                      <p>${cartTotal}</p>
                    </div>
                    <Link href="/checkout" className="block">
                      <Button className="w-full bg-[#31B65D] hover:bg-[#31B65D]/90 text-white">
                        Proceed to Checkout
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/cart" className="block mt-4">
                      <Button variant="outline" className="w-full">
                        View Cart
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Auth */}
        {!isAuth ? (
          <Link href={"/login"}>
            <Button className="bg-[#31B65D] hover:bg-[#31B65D]/90 text-white">
              Login
            </Button>
          </Link>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12 border-2 border-green-200">
                  <AvatarImage
                    src={user?.avatar || user?.image}
                    alt={user?.username || "User"}
                  />
                  <AvatarFallback className="bg-green-100 text-primary font-semibold text-lg">
                    {user?.username?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/account">
                <DropdownMenuItem>Profile</DropdownMenuItem>
              </Link>
              <Link href="/orders">
                <DropdownMenuItem>My Orders</DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  router.push("/login");
                  router.refresh();
                }}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export default Header;
