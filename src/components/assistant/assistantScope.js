export const ALL_SCOPE = { type: "all" };

/** Documents the user can pick; files with no readable text are hidden. */
export const pickableSources = (sources) =>
  sources.filter((source) => source.indexStatus !== "unsupported");

export function listSubjects(sources) {
  const subjects = new Map();
  sources.forEach((source) => {
    if (source.subject && !subjects.has(source.subject.id)) {
      subjects.set(source.subject.id, source.subject);
    }
  });
  return [...subjects.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function sourcesInScope(scope, sources) {
  if (!scope || scope.type === "all") return sources;
  if (scope.type === "subject") {
    return sources.filter((source) => source.subject?.id === scope.subjectId);
  }
  return sources.filter((source) => scope.documentIds?.includes(source.id));
}

export function describeScope(scope, sources) {
  if (!scope || scope.type === "all") return "All my documents";
  const inScope = sourcesInScope(scope, sources);
  if (scope.type === "subject") return inScope[0]?.subject?.name ?? "Subject";
  return inScope.length === 1 ? inScope[0].title : `${scope.documentIds?.length ?? 0} documents`;
}
