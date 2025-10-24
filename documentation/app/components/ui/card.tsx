import { cn } from "@/lib/utils";

const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-lg border bg-white shadow-sm", className)} {...props} />
);

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-6", className)} {...props} />;

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn("text-lg font-semibold", className)} {...props} />;

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-6 pt-0", className)} {...props} />;

export { Card, CardHeader, CardTitle, CardContent };
