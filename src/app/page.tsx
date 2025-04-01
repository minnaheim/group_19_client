import Link from "next/link";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export default function Home() {
  return (
    // "col-span-6 flex items-center justify-center bg-[#e8f0fe] max-md: h-screen"
    // "flex h-screen w-full md:grid grid-cols-10">
    <div className="col-span-6 flex items-center justify-center bg-[#e8f0fe] max-md: h-screen">
      <Card className="w-[300px] p-6 m-6">
        <h1 className="text-3xl font-bold underline">Hello world!</h1>
        <p>
          <Link href="/register">
            <Button variant={"default"}>Go to Register!</Button>
          </Link>
        </p>
        <p>
          <Link href="/login">
            <Button variant={"secondary"}>Go to Login!</Button>
          </Link>
        </p>
        <p>
          <Link href="/users/no_token/profile">
            <Button variant={"secondary"}>Go to [id] users Profile!</Button>
          </Link>
        </p>
        <p>
          {/* change opacity for the default and secondary button and */}
          <Button variant={"destructive"}>back</Button>
        </p>
      </Card>
    </div>
  );
}
