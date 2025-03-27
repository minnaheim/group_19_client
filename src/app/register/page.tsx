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

// TODO: add mappign that when clicking on the different tabs, you get sent to different login and register subpages
export default function Register() {
  return (
    <div>
      <Card className="w-[400px]">
        <Tabs defaultValue="account" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="registration">Register</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>
          <TabsContent value="registration">
            <CardContent>
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
              <br></br>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="destructive">back</Button>
              <Button>Submit</Button>
            </CardFooter>
          </TabsContent>
          <TabsContent value="login">
            <CardContent>
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
              <br></br>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="destructive">back</Button>
              <Button>Submit</Button>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

// export default function Register() {
//   return (
//     <Card className="w-[350px]">
//       <CardHeader>
//         <CardTitle>Register</CardTitle>
//         <CardDescription>If you are a new user.</CardDescription>
//       </CardHeader>
//       <CardContent>
// <form>
//   <div className="grid w-full items-center gap-4">
//     <div className="flex flex-col space-y-1.5">
//       <Label htmlFor="name">Username</Label>
//       <Input id="name" placeholder="Input your Username" />
//     </div>
//     <div className="flex flex-col space-y-1.5">
//       <Label htmlFor="framework">Password</Label>
//       <Input id="name" placeholder="Input your password" />
//     </div>
//   </div>
// </form>
//       </CardContent>
//       <CardFooter className="flex justify-between">
//         <Button variant="destructive">back</Button>
//         <Button>Submit</Button>
//       </CardFooter>
//     </Card>
//   );
// }
