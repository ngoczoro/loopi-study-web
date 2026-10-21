import GroupCallPanel from "@/components/video-call/GroupCallPanel";

export default function GroupCallTab({ group, visible = true, onLiveChange, onLeft }) {
  return (
    <GroupCallPanel
      group={group}
      visible={visible}
      onLiveChange={onLiveChange}
      onLeft={onLeft}
    />
  );
}
