import React from 'react';
import { Progress } from '@/shared/components/ui/Progress';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Target, Zap, DollarSign, Cpu, Briefcase, Heart, CheckCircle, CalendarCheck, Lightbulb } from 'lucide-react';
// --- Hero Section ---
const businessTips = [
  "Focus on outcomes, not just activity.",
  "Automate repetitive tasks to free up your time.",
  "Review your wins and lessons every week.",
  "Delegate what doesn't move the needle.",
  "Consistency beats intensity for business growth.",
  "Track your progress to stay motivated.",
  "Prioritize high-leverage actions each morning.",
  "Celebrate small wins to build momentum."
];
function getRandomTip() {
  return businessTips[Math.floor(Math.random() * businessTips.length)];
}

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getFirstName = (userName: string) => {
  if (!userName) return 'there';
  return userName.split(' ')[0];
};

const HeroSection = ({ userName, userAvatarUrl, userInitials, todayFocus, progressPercent, onStartDeepWork, onLogWin }: any) => (
  <section className="w-full bg-card/80 rounded-xl shadow border p-4 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8 mb-10">
    <div className="flex items-center gap-6 flex-1 min-w-0">
      {userAvatarUrl ? (
        <img src={userAvatarUrl} alt={userName} className="w-16 h-16 rounded-full object-cover border" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-primary">
          {userInitials || userName?.[0] || <UserIcon className="w-8 h-8" />}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-2xl font-bold flex items-center gap-2 truncate">👋 {getTimeGreeting()}, {getFirstName(userName)}</div>
        <div className="text-base text-muted-foreground mt-1 flex items-center gap-2 truncate">
          <Target className="w-4 h-4 text-primary" />
          Today’s Focus: <span className="font-semibold truncate">{todayFocus}</span>
        </div>
        {typeof progressPercent === 'number' && (
          <div className="mt-2 w-56 max-w-full">
            <Progress value={progressPercent} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">{progressPercent}% of goal</div>
          </div>
        )}
        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <span className="italic">Pro Tip: {getRandomTip()}</span>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-3 md:gap-4 md:items-end">
      <Button onClick={onStartDeepWork} size="lg" className="font-semibold flex items-center gap-2 w-full md:w-auto"><Zap className="w-4 h-4" /> Start Deep Work</Button>
      <Button onClick={onLogWin} size="lg" variant="outline" className="font-semibold flex items-center gap-2 w-full md:w-auto"><CheckCircle className="w-4 h-4" /> Log a Win</Button>
    </div>
  </section>
);

// --- Card Components ---
const DeepWorkCard = ({ tasks = [], onStart }: { tasks?: string[]; onStart: () => void }) => (
  <section className="bg-card rounded-lg shadow border p-4 sm:p-6 flex flex-col w-full md:min-w-[300px] md:max-w-[400px] flex-1 mb-6 md:mb-0">
    <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><Zap className="w-5 h-5 text-primary" /> Deep Work Block</div>
    <ul className="list-disc ml-6 mb-2 flex-1">
      {tasks.length === 0 ? (
        <li className="text-muted-foreground">No deep work tasks scheduled.</li>
      ) : (
        tasks.map((task, i) => <li key={i}>{task}</li>)
      )}
    </ul>
    <Button onClick={onStart} variant="default" className="mt-2">Start Deep Work</Button>
  </section>
);

const RevenuePulseCard = ({ actions = [], onLogWin }: { actions?: string[]; onLogWin: () => void }) => (
  <section className="bg-card rounded-lg shadow border p-4 sm:p-6 flex flex-col w-full md:min-w-[300px] md:max-w-[400px] flex-1 mb-6 md:mb-0">
    <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><DollarSign className="w-5 h-5 text-primary" /> Revenue Pulse</div>
    <ul className="list-disc ml-6 mb-2 flex-1">
      {actions.length === 0 ? (
        <li className="text-muted-foreground">No revenue actions for today.</li>
      ) : (
        actions.map((action: string, i: number) => <li key={i}>{action}</li>)
      )}
    </ul>
    <Button onClick={onLogWin} variant="outline" className="mt-2">Log a Win</Button>
  </section>
);

const AgentOpsCard = ({ agents = [] }: { agents?: { name: string; status: 'due' | 'idle' | 'failed'; onRun: () => void; onFix?: () => void }[] }) => (
  <section className="bg-card rounded-lg shadow border p-4 sm:p-6 flex flex-col w-full md:min-w-[300px] md:max-w-[400px] flex-1 mb-6 md:mb-0">
    <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><Cpu className="w-5 h-5 text-primary" /> Agent Ops</div>
    <ul className="ml-2 mb-2 flex-1">
      {agents.length === 0 ? (
        <li className="text-muted-foreground">All agents idle.</li>
      ) : (
        agents.map((agent, i) => (
          <li key={i} className="flex items-center gap-2 mb-1">
            <span className="font-medium">{agent.name}</span>
            <span className={`text-xs rounded px-2 py-0.5 ${
              agent.status === 'due' ? 'bg-yellow-100 text-yellow-800' :
              agent.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-green-100 text-green-800'
            }`}>
              {agent.status}
            </span>
            {agent.status === 'due' && (
              <Button size="sm" variant="default" onClick={agent.onRun}>Run</Button>
            )}
            {agent.status === 'failed' && agent.onFix && (
              <Button size="sm" variant="destructive" onClick={agent.onFix}>Fix</Button>
            )}
          </li>
        ))
      )}
    </ul>
  </section>
);

const StrategicProjectsCard = ({ highlights = [], onDelegate, onRequestSupport }: { highlights?: string[]; onDelegate: () => void; onRequestSupport: () => void }) => (
  <section className="bg-card rounded-lg shadow border p-4 sm:p-6 flex flex-col w-full md:min-w-[300px] md:max-w-[400px] flex-1 mb-6 md:mb-0">
    <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><Briefcase className="w-5 h-5 text-primary" /> Strategic Projects</div>
    <ul className="list-disc ml-6 mb-2 flex-1">
      {highlights.length === 0 ? (
        <li className="text-muted-foreground">No strategic highlights today.</li>
      ) : (
        highlights.map((item, i) => <li key={i}>{item}</li>)
      )}
    </ul>
    <div className="flex gap-2 mt-2">
      <Button onClick={onDelegate} variant="outline">Delegate</Button>
      <Button onClick={onRequestSupport} variant="outline">Request Support</Button>
    </div>
  </section>
);

const FamilyMarginCard = ({ onLogMargin }: { onLogMargin: () => void }) => (
  <section className="bg-card rounded-lg shadow border p-4 sm:p-6 flex flex-col w-full md:min-w-[300px] md:max-w-[400px] flex-1 mb-6 md:mb-0">
    <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><Heart className="w-5 h-5 text-primary" /> Family / Margin</div>
    <div className="text-sm mb-2 flex-1">Remember to take breaks and protect your margin time.</div>
    <Button onClick={onLogMargin} variant="ghost">Log Margin Time</Button>
  </section>
);

const EveningReviewCard = ({ onCompleteFireLog, onPlanTomorrow }: { onCompleteFireLog: () => void; onPlanTomorrow: () => void }) => (
  <section className="bg-card rounded-lg shadow border p-4 sm:p-6 flex flex-col w-full md:min-w-[300px] md:max-w-[400px] flex-1 mb-6 md:mb-0">
    <div className="flex items-center gap-2 mb-2 text-lg font-semibold"><CalendarCheck className="w-5 h-5 text-primary" /> Evening Review</div>
    <div className="flex gap-2 mt-auto">
      <Button onClick={onCompleteFireLog} variant="default">Complete Daily FIRE Log</Button>
      <Button onClick={onPlanTomorrow} variant="outline">Plan Tomorrow</Button>
    </div>
  </section>
);

export type TodayDashboardProps = {
  userName: string;
  userAvatarUrl?: string;
  userInitials?: string;
  todayFocus: string;
  fireLog: string;
  onFireLogUpdate: (value: string) => void;
  onStartDeepWork: () => void;
  deepWorkTasks?: string[];
  revenueActions?: string[];
  onLogWin: () => void;
  agentStatuses?: { name: string; status: 'due' | 'idle' | 'failed'; onRun: () => void; onFix?: () => void }[];
  strategicHighlights?: string[];
  onDelegate: () => void;
  onRequestSupport: () => void;
  onLogMargin: () => void;
  onCompleteFireLog: () => void;
  onPlanTomorrow: () => void;
  loading?: boolean;
  error?: string;
  progressPercent?: number; // 0-100, optional
};

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  userName,
  userAvatarUrl,
  userInitials,
  todayFocus,
  fireLog,
  onFireLogUpdate,
  onStartDeepWork,
  deepWorkTasks = [],
  revenueActions = [],
  onLogWin,
  agentStatuses = [],
  strategicHighlights = [],
  onDelegate,
  onRequestSupport,
  onLogMargin,
  onCompleteFireLog,
  onPlanTomorrow,
  loading,
  error,
  progressPercent,
}) => {
  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">Today</h2>
          <div className="text-red-500 mb-8">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <HeroSection
          userName={userName}
          userAvatarUrl={userAvatarUrl}
          userInitials={userInitials}
          todayFocus={todayFocus}
          progressPercent={progressPercent}
          onStartDeepWork={onStartDeepWork}
          onLogWin={onLogWin}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8">
          <DeepWorkCard tasks={deepWorkTasks} onStart={onStartDeepWork} />
          <RevenuePulseCard actions={revenueActions} onLogWin={onLogWin} />
          <AgentOpsCard agents={agentStatuses} />
          <StrategicProjectsCard highlights={strategicHighlights} onDelegate={onDelegate} onRequestSupport={onRequestSupport} />
          <FamilyMarginCard onLogMargin={onLogMargin} />
          <EveningReviewCard onCompleteFireLog={onCompleteFireLog} onPlanTomorrow={onPlanTomorrow} />
        </div>
      </div>
    </div>
  );
};

export default TodayDashboard; 
