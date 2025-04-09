"use client";

import * as React from "react";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

const PreferenceLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();

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
        <Card className="w-[600px] p-6 m-6">
          <br></br>
          <h2 className="text-xl font-bold text-center text-[#3C3F88] mb-4">
            Let’s get to know you!
          </h2>
          {children}
          {/* commented out, because for simplicity sake, this should be within pages, so that I can better construct endpoints */}
          {/* <CardFooter className="flex justify-between">
            <Button variant="destructive" onClick={() => router.push("/")}>
              Back
            </Button>
            <Button onClick={() => router.push("/movie_preferences")}>
              Next
            </Button>
          </CardFooter> */}
        </Card>
      </div>
    </div>
  );
};

export default PreferenceLayout;
