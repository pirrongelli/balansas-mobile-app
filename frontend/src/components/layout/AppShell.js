import { BottomTabs } from './BottomTabs';

export const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen bg-background" data-testid="app-shell">
      <div className="max-w-[480px] mx-auto min-h-screen relative">
        <main className="pb-20">
          {children}
        </main>
        <BottomTabs />
      </div>
    </div>
  );
};
