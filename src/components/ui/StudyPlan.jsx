import React from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

const PriorityBadge = ({ priority }) => {
  const config = {
    High: { icon: '🔥', color: 'text-danger bg-danger/10 border-danger/20' },
    Medium: { icon: '⚡', color: 'text-warning bg-warning/10 border-warning/20' },
    Low: { icon: '📌', color: 'text-success bg-success/10 border-success/20' },
  };

  const { icon, color } = config[priority] || config['Medium'];

  return (
    <span
      className={clsx(
        'text-xs px-2 py-1 rounded-full border flex items-center gap-1 font-medium',
        color
      )}
    >
      {icon} {priority}
    </span>
  );
};

const StudyPlan = ({ plan, onStartTopic }) => {
  const [expandedId, setExpandedId] = React.useState(null);

  if (!plan || !plan.topics) return null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
      <h3 className="text-xl font-heading font-bold mb-2">Your AI Study Plan</h3>

      {plan.topics.map((topic, index) => {
        const isExpanded = expandedId === topic.id;

        return (
          <div key={topic.id} className="glass-card !p-0 overflow-hidden">
            <div
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : topic.id)}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-white/10 text-gray-400 font-bold">
                  {index + 1}
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="font-semibold text-lg">{topic.title}</h4>
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={topic.priority} />
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" /> {topic.timeAllocation}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="p-5 border-t border-white/5 bg-surface/30">
                <h5 className="text-sm font-medium text-gray-400 mb-2">Subtopics to cover:</h5>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 mb-6 pl-2">
                  {topic.subtopics?.map((sub, i) => (
                    <li key={i}>{sub}</li>
                  ))}
                </ul>
                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartTopic(topic);
                    }}
                    className="bg-white/10 hover:bg-accent hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Start Studying This →
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StudyPlan;
