export default function ThinkingIndicator() {
  return (
    <div className="flex gap-1 items-center justify-center">
      <span className="w-1 h-1 bg-white rounded-full animate-bounce-delay-0"></span>
      <span className="w-1 h-1 bg-white rounded-full animate-bounce-delay-150"></span>
      <span className="w-1 h-1 bg-white rounded-full animate-bounce-delay-300"></span>
    </div>
  );
}
