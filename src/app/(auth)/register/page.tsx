import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
export default function Login() {
  return (
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
        <Button>Register</Button>
      </CardFooter>
    </Card>
  );
}
