import GroupCallPanel from "@/components/video-call/GroupCallPanel";

export default function GroupCallTab({ group, onLeft }) {
  return <GroupCallPanel group={group} onLeft={onLeft} />;
}
