export function TypingIndicator({ usernames }: { usernames: string[] }) {
  if (usernames.length === 0) return null;

  const text =
    usernames.length === 1
      ? `${usernames[0]} está digitando`
      : usernames.length === 2
        ? `${usernames[0]} e ${usernames[1]} estão digitando`
        : `${usernames[0]} e mais ${usernames.length - 1} estão digitando`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-sm text-muted-foreground animate-fade-in">
      <div className="flex gap-1">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
      </div>
      <span>{text}</span>
    </div>
  );
}
