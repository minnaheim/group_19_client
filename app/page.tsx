"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
import "@ant-design/v5-patch-for-react-19";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return <h1 className="text-3xl font-bold underline">Hello world!</h1>;
}
