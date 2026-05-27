import { ipcMain } from 'electron';
import {
  IpcChannels,
  type ChatRequest,
  type ChatResponse,
  type CheckXLimitsPayload,
  type OpenVSCodePayload,
  type SyncGithubPRsPayload,
  type TweetPayload,
  type VercelDeployPayload,
} from '../../shared/ipc.js';
import { draftTweet } from '../actions/tweet.js';
import { openInVSCode } from '../actions/vscode.js';
import { runVercelDeploy } from '../actions/vercel.js';
import { syncGithubPRs } from '../actions/slack.js';
import { checkXLimits } from '../actions/x.js';
import { runChat } from '../actions/chat.js';

/**
 * Registers every action over IPC. Each handler returns a serializable
 * ActionResult — never throws across the bridge.
 */
export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannels.ActionTweet, async (_evt, payload: TweetPayload) =>
    draftTweet(payload),
  );

  ipcMain.handle(IpcChannels.ActionOpenVSCode, async (_evt, payload: OpenVSCodePayload) =>
    openInVSCode(payload),
  );

  ipcMain.handle(IpcChannels.ActionVercelDeploy, async (_evt, payload: VercelDeployPayload) =>
    runVercelDeploy(payload),
  );

  ipcMain.handle(IpcChannels.ActionSyncGithubPRs, async (_evt, payload: SyncGithubPRsPayload) =>
    syncGithubPRs(payload),
  );

  ipcMain.handle(IpcChannels.ActionCheckXLimits, async (_evt, payload: CheckXLimitsPayload) =>
    checkXLimits(payload),
  );

  ipcMain.handle(
    IpcChannels.ChatSendMessage,
    async (_evt, payload: ChatRequest): Promise<ChatResponse> => runChat(payload),
  );
}
