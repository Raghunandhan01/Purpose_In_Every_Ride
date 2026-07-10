import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.ComponentProps<"div"> {
  glassmorphism?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glassmorphism, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl bg-surface-card p-6 shadow-sm border border-border transition-all duration-300 hover:shadow-md hover:-translate-y-1',
          glassmorphism && 'bg-surface-card/70 backdrop-blur-md border-border/50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export function CardHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 className={cn('font-semibold leading-none tracking-tight text-lg text-text-primary', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}
