import { Video } from "lucide-react";
import TabPlaceholder from "./TabPlaceholder";

// Video call is owned by the video-call feature. Replace this placeholder with
// `<GroupCallPanel groupId={group.id} />` from `@/components/video-call/GroupCallPanel`.
export default function GroupCallTab() {
  return (
    <TabPlaceholder
      icon={Video}
      title="Group video call"
      description="Video calls for this group are coming soon."
    />
  );
}
