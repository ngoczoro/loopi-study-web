export default function TabPlaceholder({ icon: Icon, title, description }) {
  return (
    <div className="bg-card rounded-2xl p-8 shadow-soft text-center space-y-2">
      {Icon && (
        <Icon className="h-8 w-8 text-muted-foreground mx-auto" strokeWidth={1.5} />
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
