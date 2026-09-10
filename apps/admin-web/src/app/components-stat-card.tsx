type StatCardProps = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex-1 rounded-[20px] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon ?? "●"}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-foreground-secondary">{label}</div>
    </div>
  );
}
