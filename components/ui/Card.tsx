import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { type HTMLAttributes } from 'react';

const cardVariants = cva('rounded-xl', {
  variants: {
    variant: {
      default: 'bg-white',
      elevated: 'bg-white shadow-lg',
      outlined: 'bg-white border border-neutral-200',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

function Card({ className, variant, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding, className }))} {...props} />;
}

export { Card, cardVariants };
