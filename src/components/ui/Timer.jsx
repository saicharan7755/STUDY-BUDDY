import { useState, useEffect } from 'react';
import { Pause, Play, AlertCircle, Coffee, Brain } from 'lucide-react';
import clsx from 'clsx';

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;

const Timer = ({ initialMinutes, onExpire }) => {
  const [isPomodoro, setIsPomodoro] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);

  // Sync initial minutes when standard mode is active
  useEffect(() => {
    if (!isPomodoro && !isBreak) {
      setTimeLeft(initialMinutes * 60); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [initialMinutes, isPomodoro, isBreak]);

  const handlePomodoroToggle = () => {
    setIsPomodoro(!isPomodoro);
    setIsBreak(false);
    setIsRunning(false);
    if (!isPomodoro) {
      // Turning ON
      setTimeLeft(POMODORO_WORK);
    } else {
      // Turning OFF
      setTimeLeft(initialMinutes * 60);
    }
  };

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      if (isPomodoro) {
        // Auto switch work/break
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsRunning(false);
        if (isBreak) {
          setIsBreak(false);
          setTimeLeft(POMODORO_WORK);
        } else {
          setIsBreak(true);
          setTimeLeft(POMODORO_BREAK);
        }
      } else {
        setIsRunning(false);
        if (onExpire) onExpire();
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onExpire, isPomodoro, isBreak]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = isPomodoro
    ? isBreak
      ? POMODORO_BREAK
      : POMODORO_WORK
    : initialMinutes * 60;
  const percentage = (timeLeft / totalSeconds) * 100;

  const isWarning = percentage <= 25 && percentage > 10;
  const isDanger = percentage <= 10;

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handlePomodoroToggle}
        className="text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1 bg-surface border border-white/10 px-2 py-1 rounded-full"
      >
        {isPomodoro ? (
          <Coffee className="w-3 h-3 text-warning" />
        ) : (
          <Brain className="w-3 h-3 text-accent" />
        )}
        {isPomodoro ? (isBreak ? 'Break Time' : 'Pomodoro Mode') : 'Standard Mode'}
      </button>

      <div
        className={clsx(
          'flex items-center gap-4 px-4 py-2 rounded-xl border glass transition-colors',
          isDanger
            ? 'border-danger/50 bg-danger/10 text-danger animate-pulse'
            : isWarning
              ? 'border-warning/50 bg-warning/10 text-warning'
              : isPomodoro && isBreak
                ? 'border-success/50 bg-success/10 text-success'
                : 'border-white/10 text-white'
        )}
      >
        <div className="font-heading font-bold text-xl tabular-nums tracking-wider">
          {formatTime(timeLeft)}
        </div>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        {isDanger && <AlertCircle className="w-5 h-5 animate-bounce" />}
      </div>
    </div>
  );
};

export default Timer;
