import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Projector } from "lucide-react";

// TODO: add mappign that when clicking on the different tabs, you get sent to different login and register subpages
export default function Register() {
  return (
    <div className="h-screen w-full grid grid-cols-10">
      {/* Left Side (30%) */}
      {/* <Projector />  TODO: -> add projector here */}
      <div className="col-span-4 bg-purple-300"></div>
      {/* Right Side (70%) */}
      <div className="col-span-6 flex items-center justify-center bg-gray-100">
        <Card className="w-[400px] p-6">
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
