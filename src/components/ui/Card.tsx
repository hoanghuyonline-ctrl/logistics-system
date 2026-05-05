interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function Card({ title, children, className = "", action }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow border ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {action}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
