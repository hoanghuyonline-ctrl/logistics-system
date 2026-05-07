export default function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin" />
      </div>
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
}
