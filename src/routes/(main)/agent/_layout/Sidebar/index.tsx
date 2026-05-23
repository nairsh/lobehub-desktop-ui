import { memo } from 'react';

// The agent-specific Topics/Cron sidebar is intentionally not registered here.
// The home sidebar (Chats + Agents) stays active via the home layout's NavPanelPortal,
// keeping the same sidebar visible whether the user is on home or inside a chat.
const Sidebar = memo(() => null);

Sidebar.displayName = 'ChatSidebar';

export default Sidebar;
