import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
// TODO: add mappign that when clicking on the different tabs, you get sent to different login and register subpages
export default function Register() {
  return (
    <div className="h-screen w-full md:grid grid-cols-10">
      {/* Left Side (30%) */}
      {/* <Projector />  TODO: -> add projector here */}
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

      {/* Right Side (70%) */}
      <div className="col-span-6 flex items-center justify-center bg-[#e8f0fe] max-md: h-screen">
        <Card className="w-[400px] p-6 m-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="registration">Register</TabsTrigger>
              <TabsTrigger value="login">Login</TabsTrigger>
            </TabsList>
            <TabsContent value="registration">
              <Card>
                <CardContent className="space-y-2">
                  <form>
                    <div className="grid w-full items-center gap-4">
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Input your Name" />
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="framework">Username</Label>
                        <Input id="name" placeholder="Input your Username" />
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="framework">Password</Label>
                        <Input id="name" placeholder="Input your password" />
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="destructive">back</Button>
                  <Button>Submit</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="login">
              <Card>
                <CardContent className="space-y-2">
                  <form>
                    <div className="grid w-full items-center gap-4">
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="name">Username</Label>
                        <Input id="name" placeholder="Input your Username" />
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="framework">Password</Label>
                        <Input id="name" placeholder="Input your password" />
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="destructive">back</Button>
                  <Button>Submit</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
