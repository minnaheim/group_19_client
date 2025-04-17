"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";

// triggers the linking to the responsible page, i.e. login or register
// (so that the user is directed to /login and /register when clicking on the separate tabs)
const TabsLinkTrigger: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => (
  <TabsTrigger value={href} asChild>
    <Link href={href}>{children}</Link>
  </TabsTrigger>
);

// this layout stays the same no matter if the user is on the login or register tab
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // Extracts the last part of the path (e.g., "login" from "/login")
  // Ensure this logic correctly identifies your routes. If routes are nested, adjust accordingly.
  const activeTab = pathname.substring(pathname.lastIndexOf('/') + 1) || "login"; // Default if path is "/" or unexpected

  return (
    <div className="h-screen w-full md:grid grid-cols-10">
      <div className="max-md:hidden col-span-4 bg-[#AFB3FF]">
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <Image src="/projector.png" alt="App Icon" width={50} height={50} />
          <h1 className="text-[#3C3F88] text-2xl font-bold">Movie Night</h1>
        </div>
        <img
          className="absolute top-23 left-30 object-contain"
          src="/projector.png"
          width={400}
          height={40}
          alt=""
        />
        <img
          className="absolute bottom-25 left-40 object-contain"
          src="/popcorn.png"
          width={300}
          height={25}
          alt=""
        />
      </div>

      <div className="col-span-6 flex items-center justify-center bg-[#e8f0fe] max-md: h-screen">
        <Card className="w-[400px] p-6 m-6">
          <Tabs value={activeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              {/* clicking on the seperate links triggers page switch */}
              <TabsLinkTrigger href="register">Register</TabsLinkTrigger>
              <TabsLinkTrigger href="login">Login</TabsLinkTrigger>
            </TabsList>
            {children}
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
