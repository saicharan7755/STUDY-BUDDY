const QuizProgress = ({ current, total }) => {
  const safeTotal = Math.max(1, total);
  const percentage = Math.min(100, Math.round((current / safeTotal) * 100));

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
        <span>
          Question {Math.min(current, total)} of {total}
        </span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default QuizProgress;
