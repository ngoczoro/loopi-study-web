import { SidebarProvider } from "@/components/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import FloatingAssistantButton from "@/components/assistant/FloatingAssistantButton";
import { useRealtimeConnection } from "@/hooks/useSocket";

export function Layout({ children }) {
  useRealtimeConnection();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <FilePreviewModal />
      <FloatingAssistantButton />
    </SidebarProvider>
  );
}