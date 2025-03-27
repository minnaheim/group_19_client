import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <Button variant={"default"}>Submit</Button>
      <Button variant={"secondary"}>Second Button</Button>
      {/* change opacity for the default and secondary button and */}
      <Button variant={"destructive"}>back</Button>
    </div>
  );
}
