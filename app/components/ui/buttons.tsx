import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

const PrimaryButton = ({ children, className, ...props }: ButtonProps) => {
  return (
    <Button
      className={cn(
        "bg-red-500 hover:bg-red-600 text-white rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

const SecondaryButton = ({ children, className, ...props }: ButtonProps) => {
  return (
    <Button
      className={cn(
        "bg-orange-400 hover:bg-orange-500 text-white rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

const TertiaryButton = ({ children, className, ...props }: ButtonProps) => {
  return (
    <Button
      className={cn(
        "bg-pink-300 hover:bg-pink-400 text-white rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

export default function ButtonsDemo() {
  return (
    <div className="flex gap-4">
      <PrimaryButton>mark as seen</PrimaryButton>
      <SecondaryButton>Add to Watchlist</SecondaryButton>
      <TertiaryButton>back</TertiaryButton>
    </div>
  );
}
